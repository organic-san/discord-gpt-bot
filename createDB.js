const fs = require('fs');
const Database = require('better-sqlite3');
const DB = require('./utility/database.js');
require('dotenv').config();


module.exports = () => {
    console.log('Creating database...');
    const db = DB.getConnection();

    db.prepare(`CREATE TABLE IF NOT EXISTS white_list (
        id TEXT PRIMARY KEY,
        added_at TEXT,
        name TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS monthly_usage (
        id TEXT,
        month INTEGER,
        year INTEGER,
        tokens INTEGER,
        cost REAL,
        usage INTEGER,
        PRIMARY KEY (id, month, year),
        FOREIGN KEY (id) REFERENCES user(id)
    )`).run();
}