const db = require('../db/index.js');
require('dotenv').config();

const query = {
	text: 'SELECT * FROM users',
	values: [],
};

(async () => {
	const res = await db.query(query);
	console.log('Single query::', res.rows === undefined ? 'No Data' : res.rows);
})()
	.then(async () => {
		console.log('Transaction::');
		const client = await db.getClient();
		try {
			await client.query('BEGIN');
			const select_users = {
				text: 'SELECT * FROM users',
				values: [],
			};
			const users = await client.query(select_users);
			console.log('First query::', users.rows === undefined ? 'No Data' : users.rows);
			const select_teams = {
				text: 'SELECT * FROM teams',
				values: [],
			};
			const teams = await client.query(select_teams);
			console.log('Second query::', teams.rows === undefined ? 'No Data' : teams.rows);
			await client.query('COMMIT');
		}
		catch (err) {
			await client.query('ROLLBACK');
			throw err;
		}
		finally {
			client.release();
		}
	})
	.catch(err => console.log(err.stack));
