require('dotenv').config();
/* Bot initialization */
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Intents } = require('discord.js');

// Create client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// dynamically load commands from */commands directory
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// instantiate each command in the client
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

// Construct event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// bind event handlers to client
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Login using token
client.login(process.env.DISCORDTOKEN);