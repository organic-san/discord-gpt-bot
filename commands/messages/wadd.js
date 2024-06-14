const system = require('../../utility/system.js');
require('dotenv').config();

module.exports = {
    tag: "message",
    name: "wadd",
    
    async execute(client, msg, content) {

        await msg.channel.sendTyping();
        if(msg.author.id != process.env.AUTHOR_USERID) return;

        const target = await client.users.resolve(content);
        if(!target) return msg.channel.send("無法解析用戶。");
        system.addWhiteList(content, target.username);
        msg.channel.send(`已將 <@${content}> 加入白名單。`);
    }
};