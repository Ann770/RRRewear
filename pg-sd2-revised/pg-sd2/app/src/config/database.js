const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration - prioritize environment variables, fall back to defaults for local development
const config = {
    host: process.env.DB_HOST || 'localhost',  // Default to localhost if no env variable
    user: process.env.DB_USER || 'root',      // Default to root if no env variable
    password: process.env.DB_PASSWORD || '',  // Empty password if not set in env
    database: process.env.DB_NAME || 'sd2-db',  // Default database name
    port: process.env.DB_PORT || 3306,        // Default to port 3306
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create the connection pool
const pool = mysql.createPool(config);

// Test the connection to the database
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        return false;
    }
}

// Export pool and testConnection
module.exports = {
    pool,
    testConnection
};
