const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

// Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "admin",
    password: process.env.MYSQL_PASS || "password",
    database: process.env.MYSQL_DATABASE || "sd2-db",
    port: process.env.DB_PORT || 3308
});

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1); // Exit if connection fails
    } else {
        console.log("Connected to MySQL database successfully!");
        connection.end(); // Close connection after test
    }
});
