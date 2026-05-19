const mysql = require('mysql2');

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'eventosport',
  waitForConnections: true,
  connectionLimit:  10,
  charset:          'utf8mb4',
});

module.exports = pool.promise();
