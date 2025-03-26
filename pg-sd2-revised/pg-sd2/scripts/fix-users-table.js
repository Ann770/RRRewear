const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'sd2-db'
});

// SQL statements to fix the users table
const fixStatements = [
    // Check if id column exists
    `SHOW COLUMNS FROM users LIKE 'id'`,
    
    // Add id column if it doesn't exist
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST`,
    
    // Add last_login column if it doesn't exist
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL`,
    
    // Add other missing columns
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
async function fixTable() {
    try {
        for (const statement of fixStatements) {
            await new Promise((resolve, reject) => {
                db.query(statement, (err, results) => {
                    if (err) {
                        console.error('Error executing statement:', statement);
                        console.error('Error:', err);
                        reject(err);
                    } else {
                        console.log('Successfully executed:', statement);
                        console.log('Results:', results);
                        resolve();
                    }
                });
            });
        }
        console.log('Users table fixed successfully');
    } catch (error) {
        console.error('Error fixing users table:', error);
    } finally {
        db.end();
    }
}

// Run the fix
fixTable(); 