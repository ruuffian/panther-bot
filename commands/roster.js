const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('../db/index');
const cfg = require('../config.json');
const { registeredTeams } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roster')
		.setDescription('Fetches the roster of a Panther Corps team!')
		.addStringOption(option =>
			option
				.setName('team')
				.setDescription('The team to fetch!')
				.setRequired(true)
				.addChoices(...registeredTeams)),
	async execute(interaction) {
		const teamid = interaction.options.getString('team');
		const selectUsersByTeamId = {
			text: 'SELECT userlookup.username, users.position, users.starter FROM users INNER JOIN userlookup ON users.userid=userlookup.userid AND users.teamid=$1',
			values: [teamid] 
		};
		const users = await db.query(selectUsersByTeamId);
		const selectTeamName = {
			text: 'SELECT teamname FROM teamlookup WHERE teamid=$1',
			values: [teamid],
		};
		const teamname = await db.query(selectTeamName);
		const fields = [
			{ name: teamname ===undefined ? teamname : 'No Players!', value: '\u200b', inline: false },
		];
		for (const player of users.rows) {
			fields.push({
				name: player.username,
				value: player.starter ? player.pos : 'Sub',
				inline: true,
			});
		}
		const embedStruct = {
			color: cfg.color,
			author: {
				name: cfg.author,
				icon_url: cfg.authorIcon,
			},
			title: 'Panther Corps Teams',
			description: 'Pearse-approved Panther Corps teams!',
			fields: fields,
			thumbnail: {
				url: cfg.logo,
			},
			footer: {
				text: 'This message was brought to you by ruuffian',
				icon_url: cfg.authorIcon,
			},
			timestamp: new Date(),
		};
		await interaction.reply({ embeds: [embedStruct] });
	},
};