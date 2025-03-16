const express = require("express");
const db = require("../services/db"); // Ensure db is correctly imported
const bcrypt = require("bcryptjs"); // Using bcryptjs for better Windows compatibility
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, location } = req.body;

        if (!name || !email || !password || !location) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if the email already exists
        const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, location) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, location]
        );

        res.status(201).json({ message: "User registered successfully", userId: result.insertId });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user by email
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Store user session
        req.session.user = { id: user.id, name: user.name, email: user.email, location: user.location };

        res.json({
            message: "Login successful",
            user: { id: user.id, name: user.name, email: user.email, location: user.location }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Logout
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ message: "Logout successful" });
    });
});

module.exports = router;
