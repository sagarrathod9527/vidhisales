'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { db } = require('../db');

const router = express.Router();
router.use(express.json({ limit: '50kb' }));

const SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(48).toString('hex');
if (!process.env.JWT_SECRET) console.warn('[admin] JWT_SECRET is not set: admins will be logged out whenever the server restarts.');
const COOKIE = 'vs_admin';
const secure = () => process.env.BEHIND_PROXY === 'true' || process.env.NODE_ENV === 'production';

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message: 'Too many login attempts. Try again in 15 minutes.' }) });

/* ---- auth ---- */
function auth(req, res, next) {
    try { req.admin = jwt.verify(req.cookies[COOKIE] || '', SECRET); }
    catch (e) { return res.status(401).json({ success: false, message: 'Please sign in.' }); }
    // Block cross-site writes: browsers cannot add this header to a cross-origin form post.
    if (req.method !== 'GET' && req.get('x-requested-with') !== 'fetch') return res.status(403).json({ success: false, message: 'Blocked request.' });
    next();
}
function pageAuth(req, res, next) {
    try { jwt.verify(req.cookies[COOKIE] || '', SECRET); next(); } catch (e) { res.redirect('/admin/login'); }
}

router.post('/api/login', loginLimiter, async (req, res) => {
    const u = String(req.body.username || '').trim().slice(0, 60), p = String(req.body.password || '').slice(0, 200);
    try {
        const [rows] = await db().execute('SELECT id, username, password_hash FROM admin_users WHERE username = ?', [u]);
        const ok = rows.length && await bcrypt.compare(p, rows[0].password_hash);
        if (!ok) return res.status(401).json({ success: false, message: 'Wrong username or password.' });
        await db().execute('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [rows[0].id]);
        const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, SECRET, { expiresIn: '8h' });
        res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: secure(), maxAge: 8 * 3600 * 1000, path: '/' });
        res.json({ success: true });
    } catch (e) { console.error('[login]', e.message); res.status(500).json({ success: false, message: 'Server error.' }); }
});
router.post('/api/logout', (req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.json({ success: true }); });
router.get('/api/me', auth, (req, res) => res.json({ success: true, username: req.admin.username }));

router.post('/api/password', auth, async (req, res) => {
    const cur = String(req.body.current || ''), next = String(req.body.next || '');
    if (next.length < 8) return res.status(422).json({ success: false, message: 'New password must be at least 8 characters.' });
    const [rows] = await db().execute('SELECT password_hash FROM admin_users WHERE id = ?', [req.admin.id]);
    if (!rows.length || !(await bcrypt.compare(cur, rows[0].password_hash))) return res.status(401).json({ success: false, message: 'Current password is wrong.' });
    await db().execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(next, 12), req.admin.id]);
    res.json({ success: true });
});

/* ---- data (quotations + messages share the same handlers) ---- */
const KINDS = {
    quotes: { table: 'quotation_requests', statuses: ['new', 'contacted', 'quoted', 'closed', 'cancelled'], search: ['customer_name', 'customer_phone', 'customer_email', 'company', 'item'], prefix: 'VQ-' },
    messages: { table: 'contact_messages', statuses: ['new', 'read', 'replied'], search: ['name', 'email', 'message'], prefix: 'VC-' }
};
function kind(req, res, next) { req.k = KINDS[req.params.kind]; if (!req.k) return res.status(404).json({ success: false, message: 'Not found.' }); next(); }

function where(k, q) {
    const parts = [], args = [];
    if (q.status && k.statuses.includes(q.status)) { parts.push('status = ?'); args.push(q.status); }
    const s = String(q.q || '').trim().slice(0, 100);
    if (s) { parts.push('(' + k.search.map(c => c + ' LIKE ?').join(' OR ') + ')'); k.search.forEach(() => args.push('%' + s.replace(/[%_\\]/g, '\\$&') + '%')); }
    if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)) { parts.push('created_at >= ?'); args.push(q.from + ' 00:00:00'); }
    if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) { parts.push('created_at <= ?'); args.push(q.to + ' 23:59:59'); }
    return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', args };
}

router.get('/api/stats', auth, async (req, res) => {
    const out = {};
    for (const [name, k] of Object.entries(KINDS)) {
        const [rows] = await db().query('SELECT status, COUNT(*) n FROM ' + k.table + ' GROUP BY status');
        out[name] = { total: rows.reduce((a, r) => a + r.n, 0), byStatus: Object.fromEntries(rows.map(r => [r.status, r.n])) };
        const [[t]] = await db().query('SELECT COUNT(*) n FROM ' + k.table + ' WHERE created_at >= CURDATE()');
        out[name].today = t.n;
    }
    res.json({ success: true, stats: out });
});

router.get('/api/:kind/export.csv', auth, kind, async (req, res) => {
    const w = where(req.k, req.query);
    const [rows] = await db().query('SELECT * FROM ' + req.k.table + w.sql + ' ORDER BY id DESC LIMIT 50000', w.args);
    if (!rows.length) { res.type('text/csv').attachment(req.params.kind + '.csv'); return res.send('No data\n'); }
    const cols = Object.keys(rows[0]).filter(c => c !== 'user_agent');
    const cell = v => { let s = v instanceof Date ? v.toISOString() : String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    res.type('text/csv').attachment(req.params.kind + '-' + new Date().toISOString().slice(0, 10) + '.csv');
    res.send('\ufeff' + cols.join(',') + '\n' + rows.map(r => cols.map(c => cell(r[c])).join(',')).join('\n'));
});

router.get('/api/:kind', auth, kind, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1), limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const w = where(req.k, req.query);
    const [[c]] = await db().query('SELECT COUNT(*) n FROM ' + req.k.table + w.sql, w.args);
    const [rows] = await db().query('SELECT * FROM ' + req.k.table + w.sql + ' ORDER BY id DESC LIMIT ? OFFSET ?', [...w.args, limit, (page - 1) * limit]);
    rows.forEach(r => { r.reference = req.k.prefix + String(r.id).padStart(5, '0'); delete r.user_agent; });
    if (req.params.kind === 'quotes' && rows.length) {
        const [items] = await db().query('SELECT quotation_id, item_type, item_name, quantity FROM quotation_items WHERE quotation_id IN (?) ORDER BY id', [rows.map(r => r.id)]);
        rows.forEach(r => { r.items = items.filter(i => i.quotation_id === r.id); });
    }
    res.json({ success: true, total: c.n, page, limit, rows });
});

router.patch('/api/:kind/:id', auth, kind, async (req, res) => {
    const id = parseInt(req.params.id, 10), status = String(req.body.status || '');
    if (!id || !req.k.statuses.includes(status)) return res.status(422).json({ success: false, message: 'Invalid status.' });
    const [r] = await db().execute('UPDATE ' + req.k.table + ' SET status = ? WHERE id = ?', [status, id]);
    res.status(r.affectedRows ? 200 : 404).json({ success: !!r.affectedRows });
});
router.delete('/api/:kind/:id', auth, kind, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const [r] = await db().execute('DELETE FROM ' + req.k.table + ' WHERE id = ?', [id]);
    res.status(r.affectedRows ? 200 : 404).json({ success: !!r.affectedRows });
});

router.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Not found.' }));
router.use((err, req, res, next) => { console.error('[admin]', err.message); res.status(500).json({ success: false, message: 'Server error.' }); });

module.exports = { router, pageAuth };
