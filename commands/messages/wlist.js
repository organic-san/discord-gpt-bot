const system = require('../../utility/system.js');
require('dotenv').config();

module.exports = {
    tag: "message",
    name: "wlist",
    
    async execute(client, msg, content) {

        await msg.channel.sendTyping();
        if(msg.author.id != process.env.AUTHOR_USERID) return;

        const data = system.getAllWhiteList();
        let str = "";
        data.forEach(e => {
            str += `${e.id} - ${e.name}\n`;
        });
        msg.channel.send(`白名單：\`\`\`${str}\`\`\``);
    }
};