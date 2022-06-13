require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { v4 } = require('uuid');
const db = require('../db');

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
						.setName('name')
						.setDescription('The name of the team to be registered!')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('captain')
						.setDescription('The team captain')
						.setRequired(true),
				),
		)
		.addSubcommand(command =>
			command
				.setName('player')
				.setDescription('Register a player to a team!')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('The name of the player to be registered!')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('team')
						.setDescription('The team to register the player to!')
						.setRequired(true)
						.addChoices(
							{ name: 'Econ', value: 'Economy' },
							{ name: 'Exec', value: 'Executive' },
						),
				)
				.addBooleanOption(option =>
					option
						.setName('starter')
						.setDescription('Is this player a starter?')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('position')
						.setDescription('The position the player plays.')
						.setRequired(true)
						.addChoices(
							{ name: 'Top', value: 'TOP' },
							{ name: 'Jungle', value: 'JUNG' },
							{ name: 'Mid', value: 'MID' },
							{ name: 'ADC', value: 'ADC' },
							{ name: 'Support', value: 'SUP' },
							{ name: 'Fill', value: 'FILL' },

						)),
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
		case 'team': {
			const teamname = interaction.options.getString('name');
			const captain = interaction.options.getString('captain');
			await interaction.reply({
				content: `Registering ${teamname} with captain ${captain}?`,
				components: [row],
				ephemeral: true,
			});

			interaction.client.once('interactionCreate', async button => {
				if (!button.isButton()) return;
				const confirm = button.customId;
				if (confirm === 'accept') {
					let text = 'INSERT INTO teams VALUES ($1, $2)';
					const teamid = v4();
					let values = [teamid, captain];
					db.query(text, values, (err, _) => {
						if (err) throw err;
					});

					text = 'INSERT INTO teamlookup VALUES ($1, $2) RETURNING *';
					values = [teamid, teamname];
					db.query(text, values, async (err, res) => {
						if (err) throw err;
						await button.reply({
							content:`Team ${res.rows[0].teamname} registered!`,
							ephemeral: true,
						});
					});
				}
				else if (confirm === 'decline') {
					await button.reply({
						content:'Registration canceled.',
						ephemeral: true,
					});
				}
			});
			break;
		}

		case 'player': {
			const playername = interaction.options.getString('name');
			const teamname = interaction.options.getString('team');
			// confirm input
			await interaction.reply({
				content: `Registering ${playername} to team ${teamname}?`,
				components: [row],
				ephemeral: true,
			});
			// locally handle button press
			interaction.client.once('interactionCreate', async button => {
				if (!button.isButton()) return;
				const confirm = button.customId;
				if (confirm === 'accept') {
					// db queries
					let text = 'SELECT teamid FROM teamlookup WHERE teamname=$1';
					let values = [teamname];
					db.query(text, values, (err, res) => {
						if (err) throw err;
						text = 'INSERT INTO users VALUES ($1, $2, $3, $4)';
						const userid = v4();
						const teamid = res.rows[0].teamid;
						const starter = interaction.options.getBoolean('starter');
						const position = interaction.getString('position');
						values = [userid, teamid, starter, position];
						db.query(text, values, (err, _) => {
							if (err) throw err;
							text = 'INSERT INTO userlookup VALUES ($1, $2) RETURNING *';
							values = [userid, playername];
							db.query(text, values, async (err, res2) => {
								if (err) throw err;
								await button.reply({
									content:`Player ${res2.rows[0].userid} registered for team ${res2.rows[0].teamid}!`,
									ephemeral: true,
								});
							});
						});
					});
				}
				else if (confirm === 'decline') {
					await button.reply({
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