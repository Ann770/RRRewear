const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

// Create a connection pool for better performance & auto-reconnect
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASS || "",
    database: process.env.MYSQL_DATABASE || "sd2-db",
    port: process.env.DB_PORT || 3308, // Default MySQL port
    waitForConnections: true,
    connectionLimit: 10, // Allow multiple connections
    queueLimit: 0
});

// Utility function to query the database
async function query(sql, params) {
    try {
        const [rows, fields] = await pool.execute(sql, params);
        return rows;
    } catch (err) {
        console.error("Database Query Error:", err);
        throw err;
    }
}

// Test the connection
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log(`Connected to MySQL database at ${process.env.MYSQL_HOST}:${process.env.DB_PORT}`);
        conn.release(); // Release the connection back to the pool
    } catch (err) {
        console.error("Database connection failed:", err);
    }
})();

module.exports = { query };
