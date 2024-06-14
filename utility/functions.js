const Discord = require('discord.js');
require('dotenv').config();

module.exports = {
    sliceByWordCount(str, count) {
        const sends = [];
        while(str.length > count) {
            sends.push(str.slice(0, count));
            answer = str.slice(count);
        }
        sends.push(str);
        return sends;
    },

    costCalc(model, token) {
        let cost = 0;
        if(model === "gpt-4o") {
            cost = 5/1000000;
        }
        return (cost * token).toFixed(5);
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
};