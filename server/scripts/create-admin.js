'use strict';
// Usage: npm run create-admin -- <username> <password>   (creates the admin, or resets that admin's password)
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const database = require('../db');
(async () => {
    const [u, p] = process.argv.slice(2);
    if (!u || !p || p.length < 8) { console.error('Usage: npm run create-admin -- <username> <password (min 8 chars)>'); process.exit(1); }
    await database.init();
    await database.db().execute('INSERT INTO admin_users (username, password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)', [u, await bcrypt.hash(p, 12)]);
    console.log('Admin "' + u + '" is ready. Sign in at /admin');
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
