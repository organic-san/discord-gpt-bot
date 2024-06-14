const Discord = require('discord.js');
const DB = require('./database.js');
const func = require('./functions.js');
require('dotenv').config();


module.exports = {
    isInWriteList(userId) {
        const db = DB.getConnection();
        const stmt = db.prepare(`SELECT * FROM white_list WHERE id = ?`);
        return stmt.get(userId) ? true : false;
    },

    addWhiteList(userId, username) {
        const isin = this.isInWriteList(userId);
        if(isin) return;
        const db = DB.getConnection();
        const stmt = db.prepare(`INSERT INTO white_list (id, added_at, name) VALUES (?, ?, ?)`);
        stmt.run(userId, func.localISOTimeNow(), username);
    },

    removeWhiteList(userId) {
        const isin = this.isInWriteList(userId);
        if(!isin) return;
        const db = DB.getConnection();
        const stmt = db.prepare(`DELETE FROM white_list WHERE id = ?`);
        stmt.run(userId);
    },

    getAllWhiteList() {
        const db = DB.getConnection();
        const stmt = db.prepare(`SELECT * FROM white_list`);
        const result = stmt.all();
        return result;
    },

    recordCost(userid, token, cost) {
        const db = DB.getConnection();
        const stmt = db.prepare(`SELECT * FROM user WHERE id = ?`);
        const user = stmt.get(userid);
        if(!user) {
            const userData = db.prepare(`SELECT * FROM white_list WHERE id = ?`).get(userid);
            if(!userData) return;
            const stmt = db.prepare(`INSERT INTO user (id, name) VALUES (?, ?)`);
            stmt.run(userid, userData.name);
        }
        const month = func.getLocalMonth();
        const year = func.getLocalYear();
        const monthlyData = db.prepare(`SELECT * FROM monthly_usage WHERE id = ? AND month = ? AND year = ?`).get(userid, month, year);
        if(!monthlyData) {
            const stmt = db.prepare(`INSERT INTO monthly_usage (id, month, year, tokens, cost, usage) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run(userid, month, year, token, cost, 1);
        } else {
            const stmt = db.prepare(`UPDATE monthly_usage SET tokens = ?, cost = ?, usage = ? WHERE id = ? AND month = ? AND year = ?`);
            stmt.run(monthlyData.tokens + token, monthlyData.cost + cost, monthlyData.usage + 1, userid, month, year);
        }
        
    },
};