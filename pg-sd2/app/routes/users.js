const express = require("express");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    const { name, email, password, location } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("INSERT INTO users (name, email, password, location) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, location],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "User registered successfully", id: result.insertId });
        });
});

// User Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ error: "Invalid credentials" });
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Invalid credentials" });
        res.json({ message: "Login successful", user });
    });
});

module.exports = router;

