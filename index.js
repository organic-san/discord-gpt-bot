const Discord = require('discord.js');
const OpenAI = require('openai');

const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

const options = {
    restTimeOffset: 100,
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.MessageContent,
    ],
};
const client = new Discord.Client(options);

if(!fs.existsSync(process.env.DATABASE_URL)) {
    const createDB = require('./createDB');
    createDB();
}

client.once('ready', () => {
    console.log('Bot is online!');
});

const eventFiles = fs.readdirSync('./models').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const command = require(`./models/${file}`);
    client.on(command.event, (...args) => command.execute(client, ...args));
    delete require.cache[require.resolve(`./models/${file}`)];
}

client.messageCmds = new Discord.Collection();
const msgCmdFiles = fs.readdirSync('./commands/messages').filter(file => file.endsWith('.js'));
for (const file of msgCmdFiles) {
    const command = require(`./commands/messages/${file}`);
    client.messageCmds.set(command.name, command);
    delete require.cache[require.resolve(`./commands/messages/${file}`)];
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);