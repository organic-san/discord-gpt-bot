const Discord = require('discord.js');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const func = require('../../utility/functions');
const system = require('../../utility/system');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY });

module.exports = {
    tag: "interaction",
    data: new Discord.SlashCommandBuilder()
        .setName("gpt")
        .setDescription("Hi! Athena No.4")
        .addStringOption(option =>
            option.setName("prompt")
                .setDescription("輸入你的問題或提示")
                .setRequired(true)
        ),

    async execute(client, interaction) {
        await interaction.deferReply();
        const prompt = interaction.options.getString("prompt");

        try {
            const chatSession = ai.chats.create({
                model: process.env.DEFAULT_MODEL || 'gemini-3.1-flash-lite-preview',
                config: {
                    systemInstruction: fs.readFileSync("./prompts/default.txt", "utf-8")
                        .replaceAll('{botName}', client.user.username),
                },
                history: [],
            });
            
            const resault = await chatSession.sendMessage({
                message: {
                    text: prompt,
                },
            });

            const usage = resault.usageMetadata;
            const inputTokens = usage?.promptTokenCount || 0;
            const outputTokens = usage?.candidatesTokenCount || 0;

            system.recordUsage(
                interaction.user.id, 
                interaction.user.username, 
                inputTokens, 
                outputTokens, 
                func.calcGeminiCost(inputTokens, outputTokens)
            );

            const sends = func.sliceByWordCount(resault.text, 1950);
            await interaction.editReply(sends[0]);
            for (let i = 1; i < sends.length; i++) {
                await interaction.followUp(sends[i]);
            }
        } catch (err) {
            if(error.message?.includes("429")) {
                await interaction.editReply(`逼逼! 能量飲料耗光了...`);
                return;
            }
            console.error(err);
            await interaction.editReply("在處理過程中發生意外的錯誤：```" + err + "```請稍後再試一次。\n" + `<@${process.env.AUTHOR_USERID}>`);
            return;
        }
    }
};
