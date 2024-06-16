const Discord = require('discord.js');
const system = require('../../utility/system.js');
require('dotenv').config();

module.exports = {
    tag: "message",
    name: "wlist",
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
        if(msg.author.id != process.env.AUTHOR_USERID) return;

        const data = system.getAllWhiteList();
        let str = "";
        data.forEach(e => {
            str += `${e.id} - ${e.name}\n`;
        });
        msg.channel.send(`白名單：\`\`\`${str}\`\`\``);
    }
};