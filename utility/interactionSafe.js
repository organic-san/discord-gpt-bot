const Discord = require('discord.js');
const notify = require('./notify');

// interaction / 回應已失效（無法再回應）的 Discord 錯誤碼：
//  10062 Unknown interaction     —— 3 秒 ack 視窗逾時（最常見），或 token 失效
//  40060 Already acknowledged    —— 已 ack 過（連點 / 重複回應）
//  10008 Unknown Message         —— 要 editReply 的回應訊息已不存在
const DEAD_CODES = new Set([10062, 40060, 10008]);

/** 此錯誤是否代表「interaction 已死、再也無法回應」。 */
function isDead(error) {
    return !!error && DEAD_CODES.has(error.code);
}

/** 判讀 interaction 類型（供 log 使用）。 */
function kindOf(interaction) {
    if (interaction.isChatInputCommand?.()) return 'slash';
    if (interaction.isMessageContextMenuCommand?.()) return 'context-menu(message)';
    if (interaction.isUserContextMenuCommand?.()) return 'context-menu(user)';
    if (interaction.isButton?.()) return 'button';
    if (interaction.isAnySelectMenu?.()) return 'select-menu';
    if (interaction.isModalSubmit?.()) return 'modal';
    return 'unknown';
}

/** 擷取 interaction 的完整診斷脈絡（純文字，供 log 附件使用）。 */
function describe(interaction) {
    const lines = [];
    lines.push(`type: ${kindOf(interaction)}`);
    if (interaction.commandName) lines.push(`command: ${interaction.commandName}`);
    if (interaction.customId) lines.push(`customId: ${interaction.customId}`);
    if (interaction.isAnySelectMenu?.() && Array.isArray(interaction.values)) {
        lines.push(`values: [${interaction.values.join(', ')}]`);
    }
    lines.push(`user: ${interaction.user?.tag ?? '?'} (${interaction.user?.id ?? '?'})`);
    lines.push(`guild: ${interaction.guild?.name ?? 'DM'} (${interaction.guildId ?? '-'})`);
    lines.push(`channel: ${interaction.channelId ?? '-'}`);
    lines.push(`interaction created: ${interaction.createdAt?.toISOString?.() ?? '-'}`);
    lines.push(`acked: deferred=${interaction.deferred} replied=${interaction.replied}`);

    // 右鍵「訊息」選單：附上被操作的目標訊息脈絡（例如檢舉對象）
    const target = interaction.targetMessage;
    if (target) {
        lines.push('--- target message ---');
        lines.push(`author: ${target.author?.tag ?? '?'} (${target.author?.id ?? '?'})`);
        lines.push(`url: ${target.url ?? '-'}`);
        const content = (target.content ?? '').slice(0, 500);
        lines.push(`content: ${content || '(無文字 / 僅附件)'}`);
        if (target.attachments?.size) lines.push(`attachments: ${target.attachments.size}`);
    }
    return lines.join('\n');
}

/**
 * 記錄一個已失效（逾時 / 已 ack）的 interaction。
 * 走與其他錯誤相同的原始 log 路徑（notify.error）：@ 作者、JSON stack、同時輸出 CLI 與 Discord；
 * 額外把 interaction 診斷脈絡（觸發者、目標訊息等）併入堆疊附件。
 * @param {import('discord.js').Interaction} interaction
 * @param {*} error
 * @param {string} [note] 額外情境說明（例如「處理檢舉 defer 時逾時」）
 */
function logDead(interaction, error, note) {
    console.error(error); // 完整堆疊進 CLI（與原錯誤路徑一致）
    const code = error?.code ?? '?';
    const context = (note ? `${note}\n` : '') + `--- interaction ---\n${describe(interaction)}`;
    notify.error(`互動已失效（${code}）`, error, context);
}

/**
 * 盡早 ack：把 3 秒視窗完全留給 Discord。
 * - 已 ack（deferred/replied）→ 直接視為成功。
 * - interaction 已死 → 記 log 並回傳 false，呼叫端據此放棄後續。
 * @returns {Promise<boolean>} 是否可繼續（true＝已成功 ack，可放心 editReply）
 */
async function safeDefer(interaction, opts = {}) {
    if (interaction.deferred || interaction.replied) return true;
    try {
        await interaction.deferReply(opts);
        return true;
    } catch (err) {
        if (isDead(err)) { logDead(interaction, err, 'safeDefer'); return false; }
        throw err;
    }
}

/**
 * 依 interaction 目前狀態，安全地送出/編輯回應：
 *   deferred → editReply；replied → followUp；否則 reply。
 * interaction 已死則吞掉並記 log（回傳 null）；其餘錯誤照拋。
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {object} payload 回應內容（content/embeds/components…）
 * @param {{ephemeral?: boolean}} [opts] 僅在「首次 reply/followUp」時套用 ephemeral（editReply 無法改變）
 */
async function safeRespond(interaction, payload, { ephemeral = false } = {}) {
    try {
        if (interaction.deferred) {
            const { flags, ...rest } = payload; // editReply 不能改 ephemeral，去掉 flags 避免衝突
            return await interaction.editReply(rest);
        }
        const p = ephemeral ? { ...payload, flags: Discord.MessageFlags.Ephemeral } : payload;
        if (interaction.replied) return await interaction.followUp(p);
        return await interaction.reply(p);
    } catch (err) {
        if (isDead(err)) { logDead(interaction, err, 'safeRespond'); return null; }
        throw err;
    }
}

module.exports = { DEAD_CODES, isDead, describe, logDead, safeDefer, safeRespond };
