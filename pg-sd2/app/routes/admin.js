const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Get all reported users or listings
router.get("/reports", async (req, res) => {
    try {
        const reports = await db.query("SELECT * FROM reports");
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ban a user
router.post("/ban/:userId", async (req, res) => {
    try {
        await db.query("UPDATE users SET banned = 1 WHERE id = ?", [req.params.userId]);
        res.json({ message: "User banned successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve a listing
router.post("/approve/:listingId", async (req, res) => {
    try {
        await db.query("UPDATE listings SET approved = 1 WHERE id = ?", [req.params.listingId]);
        res.json({ message: "Listing approved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
