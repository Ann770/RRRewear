const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'sd2-db'
});

// SQL statements to update the users table
const updateStatements = [
    // Add last_login column if it doesn't exist
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL`,
    
    // Add other missing columns if they don't exist
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSON`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSON`
];

// Execute each statement
async function updateTable() {
    try {
        for (const statement of updateStatements) {
            await new Promise((resolve, reject) => {
                db.query(statement, (err) => {
                    if (err) {
                        console.error('Error executing statement:', statement);
                        console.error('Error:', err);
                        reject(err);
                    } else {
                        console.log('Successfully executed:', statement);
                        resolve();
                    }
                });
            });
        }
        console.log('Users table updated successfully');
    } catch (error) {
        console.error('Error updating users table:', error);
    } finally {
        db.end();
    }
}

// Run the update
updateTable(); 