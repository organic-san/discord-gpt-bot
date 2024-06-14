module.exports = {
    tag: "message",
    name: "help",
    
    async execute(client, msg, content) {
        await msg.channel.sendTyping();

        const str = `${client.user} - 一個openai api bot\n` +
        `使用方法：\n` +
        `-gpt <text> - 使用openai api生成文本\n` +
        `\n` +
        `-wlist - 顯示白名單 (權限鎖定)\n` +
        `-wadd <user id> - 將用戶加入白名單 (權限鎖定)\n` +
        `-wremove <user id> - 將用戶移除白名單 (權限鎖定)\n` +
        `\n` +
        `-help - 顯示幫助\n` +
        `\n` +
        `作者：@organic_san`;

        msg.channel.send(str);
    }
};