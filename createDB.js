const DB = require('./utility/database.js');
require('dotenv').config();

module.exports = () => {
    console.log('Creating database...');
    const db = DB.getConnection();

    db.prepare(`CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS daily_usage (
        date TEXT,
        user_id TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        request_count INTEGER DEFAULT 0,
        PRIMARY KEY (date, user_id),
        FOREIGN KEY (user_id) REFERENCES user(id)
    );`).run();
}