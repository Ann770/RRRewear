const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Get swap recommendations for a user
router.get("/recommendations/:user_id", async (req, res) => {
    const userId = req.params.user_id;
    try {
        const recommendations = await db.query(
            `SELECT listings.* FROM listings
             JOIN users ON listings.user_id != users.id
             WHERE listings.category IN (
                 SELECT category FROM listings WHERE user_id = ?
             )
             AND listings.id NOT IN (
                 SELECT listing_id FROM swap_requests WHERE sender_id = ? OR receiver_id = ?
             )`,
            [userId, userId, userId]
        );
        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;