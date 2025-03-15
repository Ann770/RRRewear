const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Get all listings
router.get("/", async (req, res) => {
    try {
        const listings = await db.query("SELECT * FROM listings");
        res.json(listings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new listing
router.post("/add", async (req, res) => {
    const { user_id, item_name, description, category, size, image_url } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO listings (user_id, item_name, description, category, size, image_url) VALUES (?, ?, ?, ?, ?, ?)",
            [user_id, item_name, description, category, size, image_url]
        );
        res.json({ message: "Listing added successfully", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;