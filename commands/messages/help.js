const Discord = require("discord.js");

module.exports = {
    tag: "message",
    name: "help",
    /**
     * 
     * @param { Discord.Collection<string, { 
     *      data: SlashCommandSubcommandsOnlyBuilder; 
     *      tag: string; 
     *      execute(interaction: Discord.CommandInteraction): Promise<void>; 
     * }> } client 
     * @param {Discord.Message<boolean>} interaction 
     * @param {string} content
     */
    async execute(client, msg, content) {
        await msg.channel.sendTyping();

        const str = `${client.user} - 一個openai api bot\n` +
        `使用方法：\n` +
        `-gpt <text> - 使用openai api生成文本\n` +
        `\n` +
        `-costs <id?> - 統計以來使用量\n` +
        `-costsm <id?> - 本月使用量\n` +
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