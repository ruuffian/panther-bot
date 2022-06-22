require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { v4 } = require('uuid');
const db = require('../db/index.js');

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
		// register ream subcommand
		case 'team': {
			const teamname = interaction.options.getString('name');
			const captain = interaction.options.getString('captain');
			const confirmation = {
				content: `Registering ${teamname} with captain ${captain}?`,
				components: [row],
				ephemeral: true,
				fetchReply: true,
			};
			const message = await interaction.reply(confirmation);
			const filter = i => {
				return i.user.id === interaction.user.id;
			};
			message.awaitMessageComponent({ filter, time: 15000 })
				.then(async button => {
					if (button.customId === 'accept') {
						try {
							const teamid = v4();
							const insertTeam = {
								text: 'INSERT INTO teams VALUES ($1, $2)',
								values: [teamid, captain],
							};
							await db.query(insertTeam);
							const insertTeamRelation = {
								text: 'INSERT INTO teamlookup VALUES ($1, $2)',
								values: [teamid, teamname],
							};
							await db.query(insertTeamRelation);
							await interaction.editReply({
								content:`Team ${teamname} registered!`,
								components: [],
							});
						}
						catch (e) {
							console.log(e.stack);
						}
					}
					else {
						await interaction.editReply({
							content: 'Registration canceled.',
							components: [],
						});
					}
				});
			break;
		}
		// register player subcommand
		case 'player': {
			const playername = interaction.options.getString('name');
			const teamname = interaction.options.getString('team');
			// confirm input
			const confirmation = {
				content: `Registering ${playername} to team ${teamname}?`,
				components: [row],
				ephemeral: true,
				fetchReply: true,
			};
			// Collect button input
			const filter = i => {
				return i.user.id === interaction.user.id;
			};
			const message = await interaction.reply(confirmation);
			message.awaitMessageComponent({ filter, time: 15000 })
				.then(async button => {
					if (button.customId === 'accept') {
						const client = db.getClient();
						// begin database transaction
						try {
							await client.query('BEGIN');
							// convert team name into teamid
							const selectTeamId = {
								text: 'SELECT teamid FROM teamlookup WHERE teamname=$1',
								values: [teamname],
							};
							const teamid = await client.query(selectTeamId).rows[0].teamid;
							// insert player into users db
							const userid = v4();
							const starter = interaction.options.getBoolean('starter');
							const position = interaction.options.getString('position');
							const insertPlayer = {
								text: 'INSERT INTO users VALUES ($1, $2, $3, $4)',
								values: [userid, teamid, starter, position],
							};
							await client.query(insertPlayer);
							// insert relationship into userlookup table
							const insertUserRelation = {
								text: 'INSERT INTO userlookup VALUES ($1, $2)',
								values: [userid, playername],
							};
							await client.query(insertUserRelation);
							await client.query('COMMIT');
							await interaction.editReply({
								content:`Player ${playername} registered for team ${teamname}!`,
								components: [],
							});
						}
						catch (e) {
							await client.query('ROLLBACK');
							console.log(e.stack);
						}
						finally {
							client.release();
						}
					}
					else if (button.customId === 'decline') {
						await interaction.editReply({
							content: 'Registration canceled.',
							components: [],
						});
					}
					else {
						await interaction.editReply({
							content: 'Something went wrong, contact ruuffian',
							components: [],
						});
					}
				});
			break;
		}
		}
	},
};