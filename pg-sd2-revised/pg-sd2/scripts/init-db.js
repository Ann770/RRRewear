const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'sd2-db'
});

// Read the schema file
const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');

// Split the schema into individual statements
const statements = schema.split(';').filter(statement => statement.trim());

// Execute each statement
async function initDatabase() {
    try {
        for (const statement of statements) {
            if (statement.trim()) {
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
        }
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        db.end();
    }
}

// Run the initialization
initDatabase(); 