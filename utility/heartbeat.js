const Discord = require('discord.js');
const { monitorEventLoopDelay } = require('perf_hooks');
const notify = require('./notify.js');
require('dotenv').config();

// 心跳監測：每隔固定時間向監控頻道（CHECK_CH_ID）送出一則狀態訊息。目的有二：
//
//  1. 保溫 —— 讓 process 的 working set 與 gateway / REST 連線維持活躍。長時間閒置後
//     第一個互動若要付出分頁換入（swap-in）等成本，很容易超過 Discord 的 3 秒 ack 視窗，
//     造成「第一次點沒反應、第二次才成功」。
//
//  2. 取證 —— 留下可回溯的時間序列。互動逾時發生時可往前翻，比對當下的事件迴圈延遲、
//     主要分頁錯誤（＝正在換入分頁）與非自願切換（＝被 hypervisor 搶佔 CPU）。
//     只被動記錄，不主動告警、不自動重連。
const INTERVAL_MS = 3 * 60 * 1000;
const ECHO_TIMEOUT_MS = 30 * 1000; // 超過此時間仍未收到自己訊息的 gateway 回音，記為 timeout

let client = null;
let timer = null;
let seq = 0;

// 事件迴圈延遲取樣器（每 20ms 取樣，每次心跳讀完即歸零 → 數值代表「最近一個間隔內」）
const loopDelay = monitorEventLoopDelay({ resolution: 20 });

let lastUsage = null; // { usage, at } 上次的 process.resourceUsage()，用來計算增量
let lastShard = null; // { text, at } 最近一次 shard 生命週期事件
let lastEcho = null;  // 上一輪心跳的 gateway 回音延遲（ms）或 'timeout'
let pending = null;   // { seq, sentAt, timer } 等待回音中的心跳

function fmtUptime(ms) {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const pad = n => String(n).padStart(2, '0');
    return (d ? `${d}d ` : '') + `${pad(Math.floor(s % 86400 / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
}

function fmtAgo(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h${Math.floor(s % 3600 / 60)}m`;
    return `${Math.floor(s / 86400)}d${Math.floor(s % 86400 / 3600)}h`;
}

/** 直方圖數值為奈秒；無取樣時回傳 '—'。 */
function fmtNs(ns) {
    return Number.isFinite(ns) && ns > 0 ? `${(ns / 1e6).toFixed(1)} ms` : '—';
}

const fmtMB = bytes => `${Math.round(bytes / 1048576)} MB`;

/** 記錄一次 shard 生命週期事件（console + 監控頻道，不 @ 任何人）。 */
function recordShard(text) {
    lastShard = { text, at: Date.now() };
    console.log(`[heartbeat] gateway: ${text}`);
    notify.log(`🔌 gateway: ${text}`);
}

function registerShardEvents() {
    const E = Discord.Events;
    // replayed＝RESUME 後補送的事件數。互動逾時若與此同時發生，即為「事件延遲送達」的直接證據。
    client.on(E.ShardResume, (id, replayed) => recordShard(`resume #${id} replayed=${replayed}`));
    client.on(E.ShardDisconnect, (event, id) => recordShard(`disconnect #${id} code=${event?.code ?? '?'} reason=${event?.reason || '-'}`));
    client.on(E.ShardReconnecting, id => recordShard(`reconnecting #${id}`));
    client.on(E.ShardReady, (id, unavailable) => recordShard(`ready #${id}${unavailable?.size ? ` unavailableGuilds=${unavailable.size}` : ''}`));
    client.on(E.ShardError, (error, id) => recordShard(`error #${id} ${error?.message || error}`));
}

/**
 * 量測 gateway 回音：心跳訊息送出後，Discord 會把它從 gateway 推回來（bot 收得到自己的訊息）。
 * 「呼叫 send → 收到自己的 MESSAGE_CREATE」這段來回，是唯一能直接反映 gateway 是否延遲的探針。
 */
function onEcho(msg) {
    if (!pending) return;
    if (msg.channelId !== process.env.CHECK_CH_ID) return;
    if (msg.author?.id !== client.user?.id) return;
    if (!msg.content?.startsWith(`系統紀錄 #${pending.seq} `)) return;

    lastEcho = Date.now() - pending.sentAt;
    clearTimeout(pending.timer);
    pending = null;
}

function beat() {
    const now = Date.now();
    const usage = process.resourceUsage();
    const mem = process.memoryUsage();

    // resourceUsage 是累計值，取與上次心跳的增量才有意義
    const prev = lastUsage;
    const span = now - prev.at;
    const d = {
        major: usage.majorPageFault - prev.usage.majorPageFault,
        minor: usage.minorPageFault - prev.usage.minorPageFault,
        invol: usage.involuntaryContextSwitches - prev.usage.involuntaryContextSwitches,
        cpuMs: (usage.userCPUTime + usage.systemCPUTime - prev.usage.userCPUTime - prev.usage.systemCPUTime) / 1000,
    };
    lastUsage = { usage, at: now };

    const ping = client.ws.ping;
    const status = Discord.Status[client.ws.status] ?? client.ws.status;

    const lines = [
        `ping        ${Number.isFinite(ping) && ping >= 0 ? `${Math.round(ping)} ms` : '—'}  (${status})`,
        `loop lag    max ${fmtNs(loopDelay.max)} · mean ${fmtNs(loopDelay.mean)} · p99 ${fmtNs(loopDelay.percentile(99))}`,
        `memory      rss ${fmtMB(mem.rss)} · heap ${fmtMB(mem.heapUsed)}/${fmtMB(mem.heapTotal)}`,
        `page fault  major +${d.major} · minor +${d.minor}`,
        `ctx switch  involuntary +${d.invol}`,
        `cpu         ${(d.cpuMs / span * 100).toFixed(1)}%  (近 ${(span / 60000).toFixed(1)} 分鐘)`,
        `echo        ${lastEcho === null ? '—' : lastEcho === 'timeout' ? `timeout (>${ECHO_TIMEOUT_MS / 1000}s)` : `${lastEcho} ms`}`,
        `gateway     ${lastShard ? `${lastShard.text} · ${fmtAgo(now - lastShard.at)} 前` : '啟動後無事件'}`,
    ];
    loopDelay.reset();

    seq += 1;
    // 前一輪還沒等到回音就先作廢，避免舊的 timeout 蓋掉新的量測
    if (pending) clearTimeout(pending.timer);
    pending = {
        seq,
        sentAt: Date.now(),
        timer: setTimeout(() => { lastEcho = 'timeout'; pending = null; }, ECHO_TIMEOUT_MS),
    };
    pending.timer.unref?.();

    notify.log(`系統紀錄 #${seq} · 運行 ${fmtUptime(process.uptime() * 1000)}\n\`\`\`\n${lines.join('\n')}\n\`\`\``);
}

/** 啟動心跳排程；需在 clientReady、且 notify.init() 之後呼叫。 */
function start(c) {
    if (timer) return;
    client = c;
    loopDelay.enable();
    lastUsage = { usage: process.resourceUsage(), at: Date.now() };
    registerShardEvents();
    client.on(Discord.Events.MessageCreate, onEcho);

    timer = setInterval(() => {
        try { beat(); } catch (e) { console.error('[heartbeat] 心跳失敗：', e); }
    }, INTERVAL_MS);
    timer.unref?.();
    console.log(`[heartbeat] 已啟動，每 ${INTERVAL_MS / 60000} 分鐘回報一次至監控頻道`);
}

module.exports = { start };
