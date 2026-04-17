const Discord = require('discord.js');
require('dotenv').config();

module.exports = {
    name: "interaction",
    event: Discord.Events.InteractionCreate,
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.interactionCmds.get(interaction.commandName);
        if (!command) return;

        let commandName = interaction.commandName;
        if (interaction.options.getSubcommand(false)) {
            commandName += "/" + interaction.options.getSubcommand(false);
        }
        console.log(`slash command: ${commandName}, from: ${interaction.guild?.name ?? 'DM'}, user: ${interaction.user.tag} (ID: ${interaction.user.id})`);

        try {
            if (command.tag === "interaction") await command.execute(client, interaction);
        } catch (error) {
            console.error(error);
            try {
                const msg = "在處理過程中發生意外的錯誤：```" + error + "```請稍後再試一次。\n" + `<@${process.env.AUTHOR_USERID}>`;
                await interaction.reply({ content: msg }).catch(async () => {
                    await interaction.editReply({ content: msg, embeds: [], components: [] });
                });
            } catch (err) {
                console.error(err);
            }
        }
    }
}