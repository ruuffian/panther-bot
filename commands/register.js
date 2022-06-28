require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { v4 } = require('uuid');
const db = require('../db/index.js');
const { registeredTeams, positions } = require('../config.json');

const confirmationButtons = new MessageActionRow()
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
		.setDefaultMemberPermissions(0)
		.setName('register')
		.setDescription('Register or unregister a team or player with Panther Bot!')
		.addSubcommandGroup(group =>
			group
				.setName('add')
				.setDescription('Add a player or team!')
				.addSubcommand(command =>
					command
						.setName('team')
						.setDescription('Register a team!')
						.addStringOption(option =>
							option
								.setName('teamname')
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
								.setName('username')
								.setDescription('The name of the player to be registered!')
								.setRequired(true),
						)
						.addStringOption(option =>
							option
								.setName('teamname')
								.setDescription('The team to register the player to!')
								.setRequired(true)
								.addChoices(...registeredTeams),
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
								.addChoices(...positions)),
				))
		.addSubcommandGroup(group =>
			group
				.setName('remove')
				.setDescription('Remove a player or team!')
				.addSubcommand(command =>
					command
						.setName('team')
						.setDescription('Remove a team!')
						.addStringOption(option =>
							option
								.setName('teamname')
								.setDescription('The team to be removed.')
								.setRequired(true)
								.addChoices(...registeredTeams),
						),
				)
				.addSubcommand(command =>
					command
						.setName('player')
						.setDescription('Remove a player!')
						.addStringOption(option =>
							option
								.setName('username')
								.setDescription('The player to be removed.')
								.setRequired(true),
						),
				),
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply();
		switch (subcommand) {
		// register team subcommand
		case 'team': {
			const teamname = interaction.options.getString('teamname');
			const captain = interaction.options.getString('captain');
			const confirmationMessage = {
				content: `Registering ${teamname} with captain ${captain}?`,
				components: [confirmationButtons],
				ephemeral: true,
				fetchReply: true,
			};
			const message = await interaction.followUp(confirmationMessage);
			const filter = i => {
				return i.user.id === interaction.user.id;
			};
			const button = await message.awaitMessageComponent({ filter, time: 15000 });
			if (button.customId === 'accept') {
				// Checkout client for db transaction
				const client = await db.getClient();
				try {
					await client.query('BEGIN');
					const teamid = v4(0, null, 0);
					const insertTeam = {
						text: 'INSERT INTO teams VALUES ($1, $2)',
						values: [teamid, captain],
					};
					await client.query(insertTeam);
					const insertTeamRelation = {
						text: 'INSERT INTO teamlookup VALUES ($1, $2)',
						values: [teamid, teamname],
					};
					await client.query(insertTeamRelation);
					await client.query('COMMIT');
					await interaction.editReply({
						content: `Team ${teamname} registered!`,
						components: [],
					});
				}
				catch (err) {
					client.query('ROLLBACK');
					console.log(err.stack);
				}
				finally {
					client.release();
				}
			}
			else {
				await interaction.editReply({
					content: 'Registration canceled.',
					components: [],
				});
			}
			break;
		}
		// register player subcommand
		case 'player': {
			const playername = interaction.options.getString('username');
			const teamid = interaction.options.getString('teamname');
			const selectTeamName = {
				text: 'SELECT teamname FROM teamlookup WHERE teamid=$1',
				values: [teamid],
			};
			const teamname = await db.query(selectTeamName).rows[0].teamid;
			// confirm input
			const confirmation = {
				content: `Registering ${playername} to team ${teamname}?`,
				components: [confirmationButtons],
				ephemeral: true,
				fetchReply: true,
			};
			// Collect button input
			const filter = i => {
				return i.user.id === interaction.user.id;
			};
			const message = await interaction.reply(confirmation);
			const button = await message.awaitMessageComponent({ filter, time: 15000 });
			try {
				if (button.customId === 'accept') {
					const client = db.getClient();
					// begin database transaction
					try {
						await client.query('BEGIN');
						// insert player into users db
						const userid = v4(0, null, 0);
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
							content: `Player ${playername} registered for team ${teamname}!`,
							components: [],
						});
					}
					catch (err) {
						await client.query('ROLLBACK');
						throw err;
					}
					finally {
						client.release();
					}
				}
				else {
					await interaction.editReply({
						content: 'Registration canceled.',
						components: [],
					});
				}
			}
			catch (err) {
				console.log(err.stack);
			}
			break;
		}
		default : {
			await interaction.editReply({
				content: 'Registration failed, contact ruuffian',
				components: [],
				ephemeral: true,
			});
			break;
		}
		}
	},
};