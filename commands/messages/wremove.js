const system = require('../../utility/system.js');
require('dotenv').config();

module.exports = {
    tag: "message",
    name: "wremove",
    
    async execute(client, msg, content) {

        await msg.channel.sendTyping();
        if(msg.author.id != process.env.AUTHOR_USERID) return;

        const target = await client.users.resolve(content);
        if(!target) return msg.channel.send("無法解析用戶。");
        system.removeWhiteList(content);
        msg.channel.send(`已將 <@${content}> 移除白名單。`);
    }
};