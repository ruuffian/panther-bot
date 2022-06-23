const { Pool } = require('pg');

const pool = new Pool();

pool.on('error', (err, _) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

pool.on('acquire', client => {
	console.log(`Client checked out`)
})

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
		const poolClient = await pool.connect();
		poolClient.query = (...args) => {
			const start = Date.now();
			const apply = query.apply(poolClient, args);
			const duration = Date.now() - start;
			console.log(`Executed ${typeof(args) === typepof({}) ? args.text : args} @${new Date(Date.now()).toISOString()} returning ${apply.rowCount === undefined ? 0 : apply.rowcount} rows taking ${duration}ms.`);
			return apply;
		};
		console.log(poolClient);
		return poolClient;
	},
};