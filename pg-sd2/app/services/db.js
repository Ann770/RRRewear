require("dotenv").config();
const mysql = require('mysql2/promise');

const config = {
  db: {
    host: process.env.MYSQL_HOST, // ✅ Use MYSQL_HOST instead of DB_CONTAINER
    port: process.env.DB_PORT,
    user: process.env.MYSQL_USER, // ✅ Use MYSQL_USER, not ROOT_USER
    password: process.env.MYSQL_PASS, // ✅ Use MYSQL_PASS, not ROOT_PASSWORD
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5, // Increased for better performance
    queueLimit: 0,
  },
};

const pool = mysql.createPool(config.db);

// Utility function to query the database
async function query(sql, params) {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
}

module.exports = { query };
