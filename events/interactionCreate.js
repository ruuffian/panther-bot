module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		// Scan the commands array, and if it is a command execute it
		if (!interaction.isCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		// Basic logging
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	},
};