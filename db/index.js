const { Pool } = require('pg');

const pool = new Pool();

pool.on('error', (err, _) => {
	console.error('Unexpected error.', err);
	process.exit(-1);
});

pool.on('acquire', () => {
	console.log('Client checked out.');
});

// Queries pg with a query object and logs the time, query text, and amount of data returned
module.exports = {
	async query(query) {
		const start = Date.now();
		const res = await pool.query(query);
		const duration = Date.now() - start;
		console.log(`Executed "${query.text}" @${new Date(Date.now()).toISOString()} returning ${res.rowCount} rows taking ${duration}ms.`);
		return res;
	},
	async getClient() {
		const poolClient = await pool.connect();
		const query = poolClient.query;
		poolClient.query = (...args) => {
			const start = Date.now();
			const apply = query.apply(poolClient, args);
			const duration = Date.now() - start;
			console.log(`Executed "${args[0].text === undefined ? args : args[0].text}" @${new Date(Date.now()).toISOString()} returning ${apply.rowCount === undefined ? 0 : apply.rowCount} rows taking ${duration > 0 ? duration : 0}ms.`);
			return apply;
		};
		return poolClient;
	},
};