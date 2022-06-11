const { Client } = require('pg');

const client = new Client({
	user: 'postgres',
	host: 'localhost',
	database: 'postgres',
	password: 'test',
	port: 5432,
});

client.connect();

client.query('SELECT * FROM users', (err, res) => {
	if (err) {
		console.log('Error::', err);
	}
	else {
		console.log('Result::', res.rows);
	}
	client.end();
});