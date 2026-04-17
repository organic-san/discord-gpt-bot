const Discord = require('discord.js');
require('dotenv').config();

module.exports = {
    tag: "interaction",
    data: new Discord.SlashCommandBuilder()
        .setName("help")
        .setDescription("顯示可用指令說明"),

    async execute(client, interaction) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`${client.user.username} - Gemini API Bot`)
            .setColor(0x4285F4)
            .setDescription("以下是可用的 Slash 指令：")
            .addFields(
                {
                    name: "/gpt `prompt`",
                    value: "我會回答你的問題或提示。",
                },
                {
                    name: "/costs `period`",
                    value: "查詢 API 使用量與估算費用。\n選項：`今日` / `本月` / `累計`",
                },
                {
                    name: "/help",
                    value: "顯示此幫助訊息。",
                },
            )
            .setFooter({ text: "作者：@organic_san" });

        await interaction.reply({ embeds: [embed] });
    }
};
