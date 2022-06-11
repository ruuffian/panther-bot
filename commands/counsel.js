const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('counsel')
		.setDescription('Lists the current Panther Corps Staff members'),
	async execute(interaction) {
		const counselEmbed = {
			color: 0x2952f0,
			title: 'The Counsel',
			author: {
				name: 'ruuffian',
				icon_url: 'https://i.imgur.com/ntBDWzO.png',
			},
			description: 'The residing counsel of Panther Corps',
			thumbnail: {
				url: 'https://i.imgur.com/TGoK7ho.png',
			},
			fields: [
				{
					name: 'The Triumverate',
					value: '\u200b',
					inline: false,
				},
				{
					name: 'Panther in Chief',
					value: 'PC JackEboy',
					inline: true,
				},
				{
					name: 'Chief of Staff',
					value: 'PC Praetorian',
					inline: true,
				},
				{
					name: 'Centurion of the Corps',
					value: 'PC Ramcannon',
					inline: true,
				},
				{
					name: 'Captains',
					value: '\u200b',
					inline: false,
				},
				{
					name: 'PC Ghosts',
					value: 'PC Seir',
					inline: true,
				},
				{
					name: 'PC Highlanders',
					value: 'PC ruuffian',
					inline: true,
				},
				{
					name: 'PC Sentinels',
					value: 'PC Ramcannon',
					inline: true,
				},
				{
					name: 'PC Recruits',
					value: 'St Rosel',
					inline: true,
				},
			],
			timestamp: new Date(),
			footer: {
				text: 'This message was brought to you by ruuffian',
				icon_url: 'https://i.imgur.com/ntBDWzO.png',
			},

		};
		await interaction.reply({ embeds: [counselEmbed] });
	},
};