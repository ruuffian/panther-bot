const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('../db/index');
const cfg = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roster')
		.setDescription('Fetches the roster of a Panther Corps team!')
		.addStringOption(option =>
			option
				.setName('team')
				.setDescription('The team to fetch!')
				.setRequired(true)
				.addChoices(
					{ name: 'Econ', value: 'Economy' },
				)),
	async execute(interaction) {
		const teamname = interaction.options.getString('team');
		// Convert to ID
		let text = 'SELECT teamid FROM teamlookup WHERE teamname=$1';
		let values = [teamname];
		let teamid;
		db.query(text, values, async (err, res) => {
			if (err) throw err;
			teamid = await res.rows[0].teamid;
		});
		text = 'SELECT userlookup.username, users.position, users.starter FROM users INNER JOIN userlookup ON users.userid=userlookup.userid AND users.teamid=$1';
		values = [teamid];
		let team;
		db.query(text, values, async (err, res) => {
			if (err) throw err;
			team = await res.rows;
		});
		// Set Headers - Team  Captain
		//				 Team1 Captain1
		const fields = [
			{ name: teamname, value: '\u200b', inline: false },
		];
		for (const player in team) {
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