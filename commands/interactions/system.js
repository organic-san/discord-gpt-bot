const Discord = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { exec } = require('child_process');

const DB = require("../../utility/database.js");
require('dotenv').config();

module.exports = {
    tag: "interaction",
    data: new Discord.SlashCommandBuilder()
        .setName("system")
        .setDescription("系統操作")
        .addStringOption(option =>
            option.setName("action")
                .setDescription("指令")
                .setRequired(true)
        ).addStringOption(option =>
            option.setName("args")
                .setDescription("參數")
                .setRequired(false)
        ),

    async execute(client, interaction) {

        if(interaction.user.id !== process.env.AUTHOR_USERID) {
            await interaction.reply('只有受限制的對象才能使用這個指令。').catch(console.error);
            return;
        }

        const action = interaction.options.getString("action");
        const args = interaction.options.getString("args") || "";

        try {
            switch(action) {
            case "eval":
                const result = eval(args);
                await interaction.reply(`\`\`\`js\n${result}\n\`\`\``);
                break;

            case "pull":
                exec("git pull", (err, stdout, stderr) => {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        interaction.reply(`執行失敗：\`\`\`${err}\`\`\``).catch(console.error);
                        return;
                    }
                    if(stderr) {
                        console.error(`stderr: ${stderr}`);
                        interaction.reply(`執行完成，輸出錯誤：\`\`\`${stderr}\`\`\``).catch(console.error);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                    interaction.reply(`執行完成，輸出：\`\`\`${stdout}\`\`\``).catch(console.error);
                });
                break;

            case "cmdupdate":
                exec('node ester-slash.js', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`執行 ester-slash.js 時發生錯誤: ${error.message}`);
                        interaction.reply(`執行 ester-slash.js 時發生錯誤: ${error.message}`).catch(console.error);
                        return;
                    }
                    if (stderr) {
                        console.error(`stderr: ${stderr}`);
                        interaction.reply(`錯誤: ${stderr}`).catch(console.error);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                    interaction.reply(`更新成功:\n\`\`\`${stdout}\`\`\``).catch(console.error);
                });
                break;

            case 'cmdupdateg':
            exec('node ester-slash-global.js', (error, stdout, stderr) => {
                if (error) {
                    console.error(`執行 ester-slash-global.js 時發生錯誤: ${error.message}`);
                    interaction.reply(`執行 ester-slash-global.js 時發生錯誤: ${error.message}`).catch(console.error);
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    interaction.reply(`錯誤: ${stderr}`).catch(console.error);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                interaction.reply(`更新成功:\n\`\`\`${stdout}\`\`\``).catch(console.error);
            });
            break;

            case "restart":
            case "r":
                await interaction.reply("正在重啟...").catch(console.error);
                DB.closeConnection();
                process.exit(0);
                break;

            default:
                const usage = "可用的操作：\n" +
                    "- eval <code>: eval program\n" +
                    "- pull: git pull\n" +
                    "- cmdupdate: cmd update\n" +
                    "- cmdupdateg: cmd update global\n" +
                    "- restart (r): restart bot";
                await interaction.reply(`\n\`\`\`${usage}\`\`\``).catch(console.error);
            }
        } catch (err) {
            console.error(err);
            await interaction.reply("在處理過程中發生意外的錯誤：```" + err + "```").catch(console.error);
            return;
        }

        setTimeout(() => {
            interaction.deleteReply().catch(console.error);
        }, 10 * 1000);
    }
};