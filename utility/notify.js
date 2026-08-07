const Discord = require('discord.js');
require('dotenv').config();

// 監控頻道通知工具：在機器人上線或發生未處理的錯誤時，
// 向 .env 的 CHECK_CH_ID 指定頻道發送訊息，並把完整錯誤內容以附件輸出。
// client 需在 clientReady 後由 index.js 呼叫 init() 綁定。
let client = null;

const createErrorLog = (err, extra) => {
    const errorLog =
        `${err}\n\n` +
        (extra ? extra + "\n\n" : "") +
        `Error Info: ${JSON.stringify(err, null, '\t')}\n\n` +
        `Error Route: ${err?.stack}`;
    return errorLog;
}

module.exports = {
    /**
     * 綁定 client，需在 clientReady 後呼叫一次。
     * @param {Discord.Client} c
     */
    init(c) {
        client = c;
    },

    /**
     * 向監控頻道發送一則訊息，可附帶以 txt 形式輸出的附加內容。
     * @param {string} msg - 要記錄的訊息內容
     * @param {string} [attr] - 附加檔案內容（以 txt 形式輸出）
     */
    log(msg, attr) {
        if (!client) throw new Error("notify.log Error: client not set.");
        if (!msg) return;
        console.log(msg);
        try {
            const channel = client.channels.cache.get(process.env.CHECK_CH_ID);
            if (!channel) return;
            // send 失敗只寫 CLI，不可再走 notify —— 否則網路不穩時會變成
            // 「送失敗 → unhandledRejection → notify.error → 再送失敗」的無限迴圈。
            const onFail = e => console.error('[notify] 監控頻道發送失敗：', e?.message || e);
            if (attr) {
                const atc = new Discord.AttachmentBuilder(Buffer.from(attr), { name: 'error.txt' });
                channel.send({ content: msg, files: [atc] }).catch(onFail);
            } else {
                channel.send(msg).catch(onFail);
            }
        } catch (error) {
            console.error(error);
        }
    },

    /**
     * 錯誤通知：摘要顯示於訊息並 @ 作者，完整堆疊（含 JSON）以附件輸出至 CLI 與 Discord。
     * @param {string} context - 錯誤類型描述
     * @param {Error|*} error - 錯誤物件或任意拋出值
     * @param {string} [extra] - 附加的預格式化脈絡文字（附於堆疊附件內，例如 interaction 診斷）
     */
    error(context, error, extra) {
        const errmsg = createErrorLog(error, extra);
        try {
            this.log(`<@${process.env.AUTHOR_USERID}>，${context}: ` + error, errmsg);
        } catch (err) {
            console.error(err);
        }
    },
};
