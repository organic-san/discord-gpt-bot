const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./commands/interactions').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/interactions/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(process.env.BOT_USERID, process.env.MAIN_GUILDID),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();