'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const database = require('./db');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();
if (process.env.BEHIND_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
// CSP is off because the site loads EmailJS, Tawk.to and Google Fonts from their CDNs; other helmet protections stay on.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cookieParser());

async function start() {
    await database.init();
    console.log('[db] connected to MySQL database "' + database.cfg.database + '"');

    // First admin from .env (only when no admin exists yet)
    const [[a]] = await database.db().query('SELECT COUNT(*) n FROM admin_users');
    if (!a.n && process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
        await database.db().execute('INSERT INTO admin_users (username, password_hash) VALUES (?,?)', [process.env.ADMIN_USER, await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)]);
        console.log('[admin] created first admin "' + process.env.ADMIN_USER + '". Change the password after signing in.');
    } else if (!a.n) console.warn('[admin] no admin exists. Run: npm run create-admin -- <username> <password>');

    const admin = require('./routes/admin');
    app.use('/api', require('./routes/public'));
    app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Not found.' }));

    // Admin panel (pages are protected, login page is public)
    app.use('/admin', admin.router);
    app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'admin-ui', 'login.html')));
    app.get('/admin/admin.css', (req, res) => res.sendFile(path.join(__dirname, 'admin-ui', 'admin.css')));
    app.get('/admin/login.js', (req, res) => res.sendFile(path.join(__dirname, 'admin-ui', 'login.js')));
    app.get('/admin/admin.js', admin.pageAuth, (req, res) => res.sendFile(path.join(__dirname, 'admin-ui', 'admin.js')));
    app.get(['/admin', '/admin/'], admin.pageAuth, (req, res) => res.sendFile(path.join(__dirname, 'admin-ui', 'index.html')));

    // The public website: only these folders / pages are exposed (never server/, .env, package.json)
    const st = { maxAge: '7d', index: false };
    ['css', 'js', 'assets'].forEach(d => app.use('/' + d, express.static(path.join(ROOT, d), st)));
    const pages = ['about', 'products', 'services', 'quote', 'contact'];
    app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
    app.get('/index.html', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
    pages.forEach(p => app.get(['/' + p, '/' + p + '.html'], (req, res) => res.sendFile(path.join(ROOT, p + '.html'))));
    app.use((req, res) => res.status(404).type('text').send('Page not found'));

    app.listen(PORT, () => console.log('\nVIDHI SALES running:\n  Website  http://localhost:' + PORT + '/\n  Admin    http://localhost:' + PORT + '/admin\n'));
}
start().catch(e => {
    console.error('\n[startup failed] ' + e.message);
    if (/ECONNREFUSED|ER_ACCESS_DENIED|ENOTFOUND/.test(e.code || e.message)) console.error('Check that MySQL is running and DB_HOST / DB_USER / DB_PASS in your .env are correct.');
    process.exit(1);
});
