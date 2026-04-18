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
        db.prepare(`INSERT INTO daily_usage (date, user_id, input_tokens, output_tokens, cost, request_count) VALUES (?, ?, ?, ?, ?, 1)
            ON CONFLICT(date, user_id) DO UPDATE SET 
                input_tokens = input_tokens + excluded.input_tokens,
                output_tokens = output_tokens + excluded.output_tokens,
                cost = cost + excluded.cost,
                request_count = request_count + 1
        `).run(func.getLocalDate(), userId, inputTokens, outputTokens, cost);
    },

    getDailyUsage(userId) {
        const date = func.getLocalDate();
        const r = db.prepare(
            `SELECT SUM(input_tokens) as i, SUM(output_tokens) as o, SUM(cost) as c, SUM(request_count) as q
             FROM daily_usage WHERE user_id = ? AND date = ?`
        ).get(userId, date);
        if (!r || r.q === 0) return { inputTokens: 0, outputTokens: 0, cost: 0, queryCount: 0 };
        return { inputTokens: r.i || 0, outputTokens: r.o || 0, cost: r.c || 0, queryCount: r.q || 0 };
    },

    getMonthlyUsage(userId) {
        const ym = func.getLocalYearMonth();
        const r = db.prepare(
            `SELECT SUM(input_tokens) as i, SUM(output_tokens) as o, SUM(cost) as c, SUM(request_count) as q
             FROM daily_usage WHERE user_id = ? AND date LIKE ?`
        ).get(userId, ym + '%');
        if (!r || r.q === 0) return { inputTokens: 0, outputTokens: 0, cost: 0, queryCount: 0 };
        return { inputTokens: r.i || 0, outputTokens: r.o || 0, cost: r.c || 0, queryCount: r.q || 0 };
    },

    getTotalUsage(userId) {
        const r = db.prepare(
            `SELECT SUM(input_tokens) as i, SUM(output_tokens) as o, SUM(cost) as c, SUM(request_count) as q
             FROM daily_usage WHERE user_id = ?`
        ).get(userId);
        if (!r || r.q === 0) return { inputTokens: 0, outputTokens: 0, cost: 0, queryCount: 0 };
        return { inputTokens: r.i || 0, outputTokens: r.o || 0, cost: r.c || 0, queryCount: r.q || 0 };
    },
};
