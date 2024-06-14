const Discord = require('discord.js');
const system = require('../utility/system.js');
require('dotenv').config();

module.exports = {
    name: "message",
    event: Discord.Events.MessageCreate,
    async execute(client, msg) {
        if(msg.webhookId) return;
        if(msg.author.bot) return;
    
        if(!system.isInWriteList(msg.author.id) && msg.author.id != process.env.AUTHOR_USERID) return;
    
        if(!msg.content.startsWith('-')) return;
    
        const args = msg.content.slice(1).trim().split(/\s+/);
        if(!args.length) return;
    
        const command = client.messageCmds.get(args[0]);
        if(!command) return;
        
        const content = msg.content.slice(command.name.length + 1).trim();
    
        let commandName = command.name;
        console.log(`text command: ${commandName}, from: ${msg.guild.name}, user: ${msg.author.tag} (ID: ${msg.author.id})`);
    
        try {
            if (command.tag === "message") await command.execute(client, msg, content);
        } catch (error) {
            console.log(error);
            try {
                msg.channel.send("在處理過程中發生意外的錯誤： ```" + error + "```請稍後再試一次。\n" + `<@${process.env.AUTHOR_USERID}>`);
            } catch (err) {
                console.log(err);
            }
        }
    }
}