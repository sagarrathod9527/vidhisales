'use strict';
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { db } = require('../db');
const val = require('../validators');

const router = express.Router();
const form = multer().none();            // the website posts FormData (multipart)
router.use(express.urlencoded({ extended: false, limit: '100kb' }));
router.use(form);

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests. Please wait a few minutes or call 9049007159.' })
});
const ref = (p, id) => p + String(id).padStart(5, '0');
const meta = req => [req.ip.slice(0, 45), String(req.get('user-agent') || '').slice(0, 255)];
const isBot = b => !!(b.website || b.xq_trap_7f3);

router.post('/quote', limiter, async (req, res) => {
    if (isBot(req.body)) return res.json({ success: true, reference: 'VQ-00000' });
    const { errors, value: v } = val.quote(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: errors.join(' ') });

    const summary = v.items.map(i => i.type === 'service' ? i.name + ' (service)' : i.name + ' x ' + i.qty).join('; ');
    const units = Math.max(1, v.items.reduce((n, i) => n + (i.type === 'product' ? i.qty : 0), 0));
    const conn = await db().getConnection();
    try {
        await conn.beginTransaction();
        const [r] = await conn.execute(
            'INSERT INTO quotation_requests (customer_name, customer_phone, customer_email, company, item, quantity, message, ip_address, user_agent) VALUES (?,?,?,?,?,?,?,?,?)',
            [v.name, v.phone, v.email, v.company || null, summary, units, v.message || null, ...meta(req)]);
        await conn.query('INSERT INTO quotation_items (quotation_id, item_type, item_name, quantity) VALUES ?',
            [v.items.map(i => [r.insertId, i.type, i.name, i.qty])]);
        await conn.commit();
        res.status(201).json({ success: true, reference: ref('VQ-', r.insertId) });
    } catch (e) {
        await conn.rollback();
        console.error('[quote]', e.message);
        res.status(500).json({ success: false, message: 'Sorry, we could not save your request right now. Please call 9049007159.' });
    } finally { conn.release(); }
});

router.post('/contact', limiter, async (req, res) => {
    if (isBot(req.body)) return res.json({ success: true, reference: 'VC-00000' });
    const { errors, value: v } = val.contact(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: errors.join(' ') });
    try {
        const [r] = await db().execute('INSERT INTO contact_messages (name, email, message, ip_address, user_agent) VALUES (?,?,?,?,?)', [v.name, v.email, v.message, ...meta(req)]);
        res.status(201).json({ success: true, reference: ref('VC-', r.insertId) });
    } catch (e) {
        console.error('[contact]', e.message);
        res.status(500).json({ success: false, message: 'Sorry, we could not save your message right now. Please call 9049007159.' });
    }
});

module.exports = router;
