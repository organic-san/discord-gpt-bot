const DB = require('./database.js');
const func = require('./functions.js');
require('dotenv').config();

const db = DB.getConnection();

module.exports = {
    ensureUser(userId, username) {
        const user = db.prepare(`SELECT id FROM user WHERE id = ?`).get(userId);
        if (!user) {
            db.prepare(`INSERT INTO user (id, name) VALUES (?, ?)`).run(userId, username);
            return false;
        } else {
            db.prepare(`UPDATE user SET name = ? WHERE id = ?`).run(username, userId);
            return true;
        }
    },

    recordUsage(userId, username, inputTokens, outputTokens, cost) {
        this.ensureUser(userId, username);
        const timestamp = func.localISOTimeNow();
        db.prepare(`INSERT INTO usage_log (user_id, timestamp, input_tokens, output_tokens, cost) VALUES (?, ?, ?, ?, ?)`)
            .run(userId, timestamp, inputTokens, outputTokens, cost);
    },

    getDailyUsage(userId) {
        const date = func.getLocalDate();
        const r = db.prepare(
            `SELECT SUM(input_tokens) as i, SUM(output_tokens) as o, SUM(cost) as c, COUNT(*) as q
             FROM usage_log WHERE user_id = ? AND timestamp LIKE ?`
        ).get(userId, `${date}%`);
        if (!r || r.q === 0) return { inputTokens: 0, outputTokens: 0, cost: 0, queryCount: 0 };
        return { inputTokens: r.i || 0, outputTokens: r.o || 0, cost: r.c || 0, queryCount: r.q || 0 };
    },

    getMonthlyUsage(userId) {
        const ym = func.getLocalYearMonth();
        const r = db.prepare(
            `SELECT SUM(input_tokens) as i, SUM(output_tokens) as o, SUM(cost) as c, COUNT(*) as q
             FROM usage_log WHERE user_id = ? AND timestamp LIKE ?`
        ).get(userId, `${ym}%`);
        if (!r || r.q === 0) return { inputTokens: 0, outputTokens: 0, cost: 0, queryCount: 0 };
        return { inputTokens: r.i || 0, outputTokens: r.o || 0, cost: r.c || 0, queryCount: r.q || 0 };
    },

    getTotalUsage(userId) {
        const r = db.prepare(
            `SELECT SUM(input_tokens) as i, SUM(output_tokens) as o, SUM(cost) as c, COUNT(*) as q
             FROM usage_log WHERE user_id = ?`
        ).get(userId);
        if (!r || r.q === 0) return { inputTokens: 0, outputTokens: 0, cost: 0, queryCount: 0 };
        return { inputTokens: r.i || 0, outputTokens: r.o || 0, cost: r.c || 0, queryCount: r.q || 0 };
    },
};
