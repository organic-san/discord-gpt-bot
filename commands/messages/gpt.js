const Discord = require('discord.js');
const OpenAI = require('openai');
const fs = require('fs');
const func = require('../../utility/functions');
const system = require('../../utility/system');
require('dotenv').config();

module.exports = {
    tag: "message",
    name: "gpt",
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

        const openai = new OpenAI.OpenAI({ apiKey: process.env.OPENAI_TOKEN });

        const prompt = fs.readFileSync("./prompts/default.txt", "utf-8").replaceAll('{botName}', client.user.username);

        openai.chat.completions.create({
            model: process.env.DEFAULT_MODEL,
            messages: [
                {
                    role: "system",
                    content: prompt,
                },
                {
                    role: "user",
                    content: content, 
                },
            ],
        }).then(response => {
            const answer = response.choices[0].message.content;
            const usage = response.usage;
            const sends = func.sliceByWordCount(answer, 1950);
            sends.forEach(send => {
                msg.channel.send(send);
            });

            const cost = func.costCalc(process.env.DEFAULT_MODEL, usage.total_tokens); 
            system.recordCost(msg.author.id, usage.total_tokens, parseFloat(cost));
            msg.channel.send(`使用 ${process.env.DEFAULT_MODEL} 模型 / 花費 ${cost} 美金。`);
        }).catch(err => {
            console.error(err);
            msg.channel.send("在處理過程中發生意外的錯誤： ```" + err + "```請稍後再試一次。\n" + `<@${process.env.AUTHOR_USERID}>`);
        });
    }
};