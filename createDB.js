const DB = require('./utility/database.js');
require('dotenv').config();

module.exports = () => {
    console.log('Creating database...');
    const db = DB.getConnection();

    db.prepare(`CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS usage_log (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id)
    )`).run();
}