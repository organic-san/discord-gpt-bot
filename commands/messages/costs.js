const Discord = require('discord.js');
const system = require('../../utility/system.js');
require('dotenv').config();

module.exports = {
    tag: "message",
    name: "costs",
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

        let target = await client.users.resolve(content);
        if(!target) target = msg.author;
        const data = system.getTotalCosts(target.id, target.username);
        const str = `使用者 ${target.username} 的總花費：\`\`\`` +
        `- costs: ${data.cost} USD\n` +
        `- tokens: ${data.token}\n` +
        `- usage: ${data.usage}` +
        `\`\`\``;

        msg.channel.send(str);
    }
};