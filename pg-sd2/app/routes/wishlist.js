const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Get all wishlist items for a user
router.get("/:user_id", async (req, res) => {
    try {
        const wishlist = await db.query("SELECT * FROM wishlist WHERE user_id = ?", [req.params.user_id]);
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add an item to wishlist
router.post("/add", async (req, res) => {
    const { user_id, listing_id } = req.body;
    try {
        await db.query("INSERT INTO wishlist (user_id, listing_id) VALUES (?, ?)", [user_id, listing_id]);
        res.json({ message: "Item added to wishlist" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
