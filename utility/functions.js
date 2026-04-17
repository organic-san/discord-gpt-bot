require('dotenv').config();

const INPUT_PRICE_PER_M = 0;
const OUTPUT_PRICE_PER_M = 0;

module.exports = {
    calcGeminiCost(inputTokens, outputTokens) {
        return (inputTokens / 1_000_000) * INPUT_PRICE_PER_M +
               (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_M;
    },

    sliceByWordCount(str, count) {
        const sends = [];
        while (str.length > count) {
            sends.push(str.slice(0, count));
            str = str.slice(count);
        }
        sends.push(str);
        return sends;
    },

    localISOTimeNow() {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19);
    },

    getLocalDate() {
        return this.localISOTimeNow().slice(0, 10); // YYYY-MM-DD
    },

    getLocalYearMonth() {
        return this.localISOTimeNow().slice(0, 7); // YYYY-MM
    },
};
