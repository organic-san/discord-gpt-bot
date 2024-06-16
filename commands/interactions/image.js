const Discord = require('discord.js');
const OpenAI = require('openai');
const fs = require('fs');
const func = require('../../utility/functions');
const system = require('../../utility/system');
const { name } = require('../messages/costs');
require('dotenv').config();

const Models = func.ImgModels;
const Sizes = func.Sizes;

module.exports = {
    tag: "interaction",
    data: new Discord.SlashCommandBuilder()
        .setName("image")
        .setDescription("使用 dall-e 模型生成圖片")
        .addStringOption(option => 
            option.setName("prompt")
            .setDescription("提示")
            .setRequired(true))
        .addStringOption(option =>
            option.setName("model")
            .setDescription("模型")
            .addChoices(
                {name: Models.dalle2, value: Models.dalle2},
                {name: Models.dalle3, value: Models.dalle3},
            )
            .setRequired(false)
        ).addStringOption(option =>
            option.setName("size")
            .setDescription("圖片大小")
            .addChoices(
                {name: `${Sizes.s256} (dall-e 2)`, value: Sizes.s256},
                {name: `${Sizes.s512} (dall-e 2)`, value: Sizes.s512},
                {name: `${Sizes.s1024} (both)`, value: Sizes.s1024},
                {name: `${Sizes.w1792} (dall-e 3)`, value: Sizes.w1792},
                {name: `${Sizes.h1792} (dall-e 3)`, value: Sizes.h1792},
            )
            .setRequired(false)
        ).addNumberOption(option =>
            option.setName("n")
            .setDescription("生成數量 (dall-e 3模型限制為1張)")
            .setRequired(false)
        ),
    /**
     * 
     * @param { Discord.Collection<string, { 
     *      data: SlashCommandSubcommandsOnlyBuilder; 
     *      tag: string; 
     *      execute(interaction: Discord.CommandInteraction): Promise<void>; 
     * }> } client 
     * @param {Discord.CommandInteraction} interaction 
     */
    async execute(client, interaction) {
        await interaction.deferReply();

        const prompt = interaction.options.getString("prompt");
        let model = interaction.options.getString("model") || Models.dalle3;
        let size = interaction.options.getString("size") || Sizes.s1024;
        const n = interaction.options.getNumber("n") || 1;

        if(model == Models.dalle3 && n > 1) model = Models.dalle2, size = Sizes.s1024;
        if(n > 10) return interaction.editReply("生成數量限制為 10 張圖片。");

        if(model == Models.dalle3 && size != Sizes.w1792 && size != Sizes.h1792 && size != Sizes.s1024 ||
            model == Models.dalle2 && size != Sizes.s256 && size != Sizes.s512 && size != Sizes.s1024)
            return interaction.editReply(`模型 ${model} 不支持圖片大小 ${size}。`);

        const openai = new OpenAI.OpenAI({ apiKey: process.env.OPENAI_TOKEN });
        
        await interaction.editReply("圖片生成中...");

        openai.images.generate({ prompt, model, n, size }).then(async response => {
            const cost = func.imgCostCalc(model, size, n);
            system.recordCost(interaction.user.id, 1, parseFloat(cost));
            
            await interaction.editReply("圖片解析中...");

            const images = response.data;
            const promises = [];
            images.forEach(image => {
                promises.push(func.imageUrlToBuffer(image.url));
            });
            const buffers = await Promise.all(promises);
            const atttachs = [];
            images.forEach(image => {
                atttachs.push(new Discord.AttachmentBuilder(buffers.shift()));
            });
            await interaction.editReply("圖片傳輸中...");
            await interaction.editReply({ content: `使用 ${model} 模型 / 花費 ${cost} 美金。`, files: atttachs });

        }).catch(err => {
            console.error(err);
            interaction.editReply("在處理過程中發生意外的錯誤： ```" + err + "```請稍後再試一次。\n" + `<@${process.env.AUTHOR_USERID}>`);
        });
    }
};