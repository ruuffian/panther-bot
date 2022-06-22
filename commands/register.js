require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { v4 } = require('uuid');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register a team or player with Panther Bot!')
		.addSubcommand(command =>
			command
				.setName('team')
				.setDescription('Register a team!')
				.addStringOption(option =>
					option
						.setName('team_name')
						.setDescription('The name of the team to be registered!')
						.setRequired(true)))
		.addSubcommand(command =>
			command
				.setName('player')
				.setDescription('Register a player to a team!')
				.addStringOption(option =>
					option
						.setName('player_name')
						.setDescription('The name of the player to be registered!')
						.setRequired(true))
				.addStringOption(option =>
					option
						.setName('team_name')
						.setDescription('The team to register the player to!')
						.setRequired(true)
						.addChoices(
							{ name: 'Econ', value: 'econ' },
							{ name: 'Exec', value: 'exec' },
						))),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('accept')
					.setLabel('Yes')
					.setStyle('SUCCESS'),
				new MessageButton()
					.setCustomId('decline')
					.setLabel('No')
					.setStyle('DANGER'),
			);
		switch (subcommand) {
		case 'team': {
			await interaction.reply({
				content: `Registering ${interaction.options.getString('team_name')}?`,
				components: [row],
				ephemeral: true,
			});

			interaction.client.once('interactionCreate', async button => {
				if (!button.isButton()) return;
				const confirm = button.customId;
				if (confirm === 'accept') {
					const db = require('../db');
					const text = 'INSERT INTO teams VALUES ($1, $2) RETURNING *';
					const teamid = v4();
					const teamname = interaction.options.getString('team_name');
					const values = [teamid, teamname];
					db.query(text, values, async (err, res) => {
						if (err) throw err;
						await interaction.followUp({
							content:`Team ${res.rows[0].teamname} registered!`,
							ephemeral: true,
						});
					});
				}
				else if (confirm === 'decline') {
					await interaction.followUp({
						content:'Registration canceled.',
						ephemeral: true,
					});
				}
			});
			break;
		}
		case 'player': {
			// confirm input
			await interaction.reply({
				content: `Registering ${interaction.options.getString('player_name')} \
				to team ${interaction.options.getString('team_name')}?`,
				components: [row],
				ephemeral: true,
			});
			// locally handle button press
			interaction.client.once('interactionCreate', async button => {
				if (!button.isButton()) return;
				const confirm = button.customId;
				if (confirm === 'accept') {
					// db query
					const db = require('../db');
					const text = 'INSERT INTO users VALUES ($1, $2) RETURNING *';
					const userid = interaction.options.getString('player_name');
					const teamid = interaction.options.getString('team_name');
					const values = [userid, teamid];
					db.query(text, values, async (err, res) => {
						if (err) throw err;
						await interaction.followUp({
							content:`Player ${res.rows[0].userid} registered for team ${res.rows[0].teamid}!`,
							ephemeral: true,
						});
					});
				}
				else if (confirm === 'decline') {
					await interaction.followUp({
						content: 'Registration canceled.',
						ephemeral: true,
					});
				}
			});
			break;
		}
		}
	},
};