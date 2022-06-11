const { SlashCommandBuilder } = require('@discordjs/builders');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register your account with Panther Bot!'),
	async execute(interaction) {
		// Insert the user into the lookup table with a generated ID
		const uuid = uuidv4();
		let query = {
			text: 'INSERT INTO user_lookup VALUES ($1, $2}) RETURNING *',
			values:[interaction.user.username, uuid],
		};
		const pool = new Pool();
		pool.query(query, (err, res) => {
			if (err) {
				throw err;
			}
			console.log(`User lookup created: ${res.rows[0]}`);
		});

		query = {
			text: 'INSERT INTO users VALUES ($1, $2, $3, $4}) RETURNING *',
			values: [uuid, interaction.member.permissions.has(['Panther Corps Ghosts', 'Panther Corps Highlanders', 'Panther Corps Sentinels', 'Panther Corps Recruits', 'Honored PC Veterans']), 0],
		};

		pool.query(query, (err, res) => {
			if (err) {
				throw err;
			}
			console.log(`User created: ${res.rows[0]}`);
		});

		await interaction.reply(`Player ${interaction.user.username} registered!`);
	},
};