const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roster')
		.setDescription('Fetches the roster of a Panther Corps team!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};