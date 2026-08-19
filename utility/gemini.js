const fs = require('fs');
const { GoogleGenAI, ApiError } = require('@google/genai');
require('dotenv').config();

const MODEL = process.env.DEFAULT_MODEL || 'gemini-3.5-flash-lite';

// Gemini 3.x 用 thinkingLevel（字串列舉）取代舊的 thinkingBudget。
// gemini-3.5-flash-lite 支援 MINIMAL/LOW/MEDIUM/HIGH，預設為 MINIMAL。
const THINKING_LEVEL = (process.env.GEMINI_THINKING_LEVEL || 'MINIMAL').toUpperCase();

// 輸出上限。注意：thinking token 會一併計入這個額度，所以調高 THINKING_LEVEL 時
// 這個值必須跟著調高，否則額度會被 thinking 吃光而回傳空內容（finishReason = MAX_TOKENS）。
// 預設 2048，對應 Discord 單則訊息 2000 字元的規模。
const MAX_OUTPUT_TOKENS = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '2048', 10);

// 暫時性錯誤：值得退避重試。其餘（400 參數錯誤、403 金鑰問題等）重試沒有意義。
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// system prompt 每則訊息都會用到，啟動後只讀一次，不在 event loop 上重複同步讀檔。
let promptTemplate = null;

/** 取得錯誤的 HTTP 狀態碼；非 API 錯誤（如網路層失敗）回傳 null。 */
function statusOf(err) {
    // SDK 對所有 4xx/5xx 回應都會丟出帶 status 的 ApiError。
    // 同時比對 name，避免 CJS/ESM 各載入一份時 instanceof 失效。
    if ((err instanceof ApiError || err?.name === 'ApiError') && typeof err.status === 'number') {
        return err.status;
    }
    return typeof err?.status === 'number' ? err.status : null;
}

module.exports = {
    ai,
    MODEL,
    MAX_OUTPUT_TOKENS,

    /** 取得填入機器人名稱後的 system prompt。 */
    systemPrompt(botName) {
        if (promptTemplate === null) promptTemplate = fs.readFileSync('./prompts/default.txt', 'utf-8');
        return promptTemplate.replaceAll('{botName}', botName);
    },

    /** 共用的 generation config；extra 用於各入口的差異（例如 tools）。 */
    config(botName, extra = {}) {
        return {
            systemInstruction: this.systemPrompt(botName),
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            thinkingConfig: { thinkingLevel: THINKING_LEVEL },
            ...extra,
        };
    },

    statusOf,

    /** 是否為「服務忙碌／額度用盡」這類該對使用者說軟話的錯誤。 */
    isOverloaded(err) {
        const status = statusOf(err);
        return status === 429 || status === 503;
    },

    /** 對暫時性錯誤退避重試（0.5s、1s，含抖動避免重試同時湧入）。 */
    async withRetry(fn, retries = 2) {
        for (let attempt = 0; ; attempt++) {
            try {
                return await fn();
            } catch (err) {
                if (attempt >= retries || !RETRYABLE.has(statusOf(err))) throw err;
                const delay = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
                console.warn(`[gemini] ${statusOf(err)}，${delay}ms 後重試（第 ${attempt + 1}/${retries} 次）`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    /**
     * 由 usageMetadata 取出計費用的 token 數。
     * thinking token 不含在 candidatesTokenCount 內，但 Google 依 output 費率計價，須合併。
     */
    usageOf(response) {
        const usage = response?.usageMetadata;
        return {
            inputTokens: usage?.promptTokenCount || 0,
            outputTokens: (usage?.candidatesTokenCount || 0) + (usage?.thoughtsTokenCount || 0),
        };
    },

    /** 回應沒有可用文字時的原因說明；正常有內容則回傳 null。 */
    emptyReason(response) {
        if (response?.text && response.text.trim()) return null;

        const finish = response?.candidates?.[0]?.finishReason;
        if (finish === 'MAX_TOKENS') {
            return `回應長度超過上限（maxOutputTokens = ${MAX_OUTPUT_TOKENS}，thinking 也會佔用此額度）`;
        }

        const blocked = response?.promptFeedback?.blockReason;
        return blocked || finish || '未知原因';
    },
};
