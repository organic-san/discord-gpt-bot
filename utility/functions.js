const Discord = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    ChatModels: {
        gpt4o: "gpt-4o",
        gpt4: "gpt-4",
        gpt3_5: "gpt-3.5",
    },

    ImgModels: {
        dalle3: "dall-e-3",
        dalle2: "dall-e-2",
    },
    
    Sizes: {
        s256: "256x256",
        s512: "512x512",
        s1024: "1024x1024",
        w1792: "1792x1024",
        h1792: "1024x1792",
    },

    sliceByWordCount(str, count) {
        const sends = [];
        while(str.length > count) {
            sends.push(str.slice(0, count));
            str = str.slice(count);
        }
        sends.push(str);
        return sends;
    },

    costCalc(model, token) {
        let cost = 0;
        if(model === this.ChatModels.gpt4o) {
            cost = 5/1000000;
        }
        return (cost * token).toFixed(5);
    },

    imgCostCalc(model, size, n) {
        if(model === this.ImgModels.dalle2) {
            if(size === this.Sizes.s256) return 0.016 * n;
            if(size === this.Sizes.s512) return 0.018 * n;
            if(size === this.Sizes.s1024) return 0.020 * n;
        } else if(model === this.ImgModels.dalle3) {
            if(size === this.Sizes.s1024) return 0.040 * n;
            if(size === this.Sizes.w1792) return 0.080 * n;
            if(size === this.Sizes.h1792) return 0.080 * n;
        } else {
            return 0;
        }
    },

    localISOTimeNow() {
        let tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19);
    },

    localISOTime: (t) => {
        let tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(t - tzoffset)).toISOString().slice(0, 19);
    },

    getLocalMonth() {
        return parseInt(this.localISOTimeNow().slice(5, 7));
    },

    getLocalYear() {
        return parseInt(this.localISOTimeNow().slice(0, 5));
    },


    wait(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, ms);
        })
    },

    async imageUrlToBuffer(url) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            return buffer;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },
};