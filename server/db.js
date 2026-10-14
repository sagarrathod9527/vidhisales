'use strict';
const mysql = require('mysql2/promise');

const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vidhisales'
};

let pool = null;
const db = () => pool;

const TABLES = [
    `CREATE TABLE IF NOT EXISTS quotation_requests (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        customer_name VARCHAR(120) NOT NULL,
        customer_phone VARCHAR(30) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        company VARCHAR(150) NULL,
        item TEXT NOT NULL,
        quantity INT UNSIGNED NOT NULL DEFAULT 1,
        message TEXT NULL,
        status ENUM('new','contacted','quoted','closed','cancelled') NOT NULL DEFAULT 'new',
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_q_status (status), KEY idx_q_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS quotation_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        quotation_id INT UNSIGNED NOT NULL,
        item_type ENUM('product','service') NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        quantity INT UNSIGNED NOT NULL DEFAULT 1,
        PRIMARY KEY (id), KEY idx_qi_quote (quotation_id),
        CONSTRAINT fk_qi_quote FOREIGN KEY (quotation_id) REFERENCES quotation_requests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_c_status (status), KEY idx_c_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS admin_users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        username VARCHAR(60) NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        PRIMARY KEY (id), UNIQUE KEY uq_admin_user (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

/* Creates the database (if missing), the connection pool, and all tables. */
async function init() {
    const boot = await mysql.createConnection({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password });
    await boot.query('CREATE DATABASE IF NOT EXISTS `' + cfg.database.replace(/`/g, '') + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await boot.end();
    pool = mysql.createPool({ ...cfg, waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4' });
    for (const sql of TABLES) await pool.query(sql);
    // Older installs had item VARCHAR(200): widen it so many items fit.
    try { await pool.query('ALTER TABLE quotation_requests MODIFY item TEXT NOT NULL'); } catch (e) { /* already TEXT */ }
    return pool;
}

module.exports = { init, db, cfg };
