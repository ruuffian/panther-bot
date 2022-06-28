const { promises: fs } = require('fs');
const db = require('../db/index.js');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		try {
			const content = await fs.readFile('config.json', 'utf-8');
			const json = JSON.parse(content);
			const selectTeams = {
				text: 'SELECT * FROM teamlookup',
				values: [],
			};
			const teams = await db.query(selectTeams);
			const choices = [];
			for (const team of teams.rows) {
				choices.push({ name: team.teamname, value: team.teamid });
			}
			json.registeredTeams = choices;
			await fs.writeFile('config.json', JSON.stringify(json, null, '\t'), 'utf-8');
			console.log('Updated registered teams in config.json');
			// require('../deploy-commands');
			console.log(`Ready! Logged in as ${client.user.tag}`);
		}
		catch (err) {
			console.log(err.stack);
		}
	},
};