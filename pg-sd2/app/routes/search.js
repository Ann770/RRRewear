const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Search listings by keyword
router.get("/listings", async (req, res) => {
    const { query } = req.query;
    try {
        const listings = await db.query(
            "SELECT * FROM listings WHERE item_name LIKE ? OR description LIKE ?",
            [`%${query}%`, `%${query}%`]
        );
        res.json(listings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search users by name
router.get("/users", async (req, res) => {
    const { query } = req.query;
    try {
        const users = await db.query(
            "SELECT * FROM users WHERE name LIKE ?",
            [`%${query}%`]
        );
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;