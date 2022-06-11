const db = require('../db');
require('dotenv').config();

const text = 'SELECT * FROM users';
const values = [];

db.query(text, values, (err, res) => {
	if (err) throw err;
	console.log(res.rows);
});