const { Pool } = require('pg');

const pool = new Pool();

pool.on('error', (err, _) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});


// Queries pg with a query object and logs the time, query text, and amount of data returned
module.exports = {
	async query(query) {
		const start = Date.now();
		const res = await pool.query(query);
		const duration = Date.now() - start;
		console.log(`Executed ${query.text} @${new Date(Date.now()).toISOString()} returning ${res.rowCount} rows taking ${duration}ms.`);
		return res;
	},
	async getClient() {
		const client = await pool.connect();
		// save initial state
		const query = client.query;
		const release = client.release;
		// Times out after 3 seconds and logs last query to identify leaks
		const timeout = setTimeout(() => {
			console.log('A client has been checked out for more than 5 seconds!');
			console.log(`The last executed query on this client was: ${client.lastQuery}`);
		}, 3000);
		// set query to last query
		client.query = (...args) => {
			client.lastQuery = args;
			return query.apply(client, args);
		};
		client.release = () => {
			clearTimeout(timeout);
			client.query = query;
			client.release = release;
			return release.apply(client);
		};
		// basic logging
		client.on('error', err => {
			console.log('node-pg error', err.stack);
		});
		return client;
	},
};