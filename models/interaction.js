const Discord = require('discord.js');
const system = require('../utility/system.js');
require('dotenv').config();

module.exports = {
    name: "interaction",
    event: Discord.Events.InteractionCreate,
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return;
    
        if(!system.isInWriteList(interaction.user.id) && interaction.user.id != process.env.AUTHOR_USERID) return;
    
        const command = client.interactionCmds.get(interaction.commandName);
        if (!command) return;
    
        let commandName = "";
        if (!!interaction.options.getSubcommand(false)) commandName = interaction.commandName + "/" + interaction.options.getSubcommand(false);
        else commandName = interaction.commandName;
        console.log(`slash command: ${commandName}, from: ${interaction.guild.name}, user: ${interaction.user.tag} (ID: ${interaction.user.id})`);
    
        try {
            if (command.tag === "interaction") await command.execute(client, interaction);
        } catch (error) {
            console.log(error);
            try {
                const msg = "在處理過程中發生意外的錯誤： ```" + error + "```請稍後再試一次。\n" + `<@${process.env.AUTHOR_USERID}>`;
                await interaction.reply({ content: msg }).catch(async () => {
                    await interaction.editReply({ content: msg, embeds: [], components: [] });
                });
            } catch (err) {
                console.log(err);
            }
        }
    }
}