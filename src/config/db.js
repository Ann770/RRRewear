const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'fakepassword',
    database: process.env.DB_NAME || 'rrrewear'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.error('Connection details:', {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3307,
            user: process.env.DB_USER || 'root',
            database: process.env.DB_NAME || 'rrrewear'
        });
        return;
    }
    console.log('Connected to MySQL database');
});

// Add error handler for database connection
db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was closed. Attempting to reconnect...');
        db.connect();
    } else {
        throw err;
    }
});

module.exports = db;