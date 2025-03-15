const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Get all swap requests
router.get("/", async (req, res) => {
    try {
        const swapRequests = await db.query("SELECT * FROM swap_requests");
        res.json(swapRequests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new swap request
router.post("/add", async (req, res) => {
    const { sender_id, receiver_id, listing_id } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO swap_requests (sender_id, receiver_id, listing_id, status) VALUES (?, ?, ?, 'pending')",
            [sender_id, receiver_id, listing_id]
        );
        res.json({ message: "Swap request sent successfully", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update swap request status
router.put("/update/:id", async (req, res) => {
    const { status } = req.body;
    try {
        await db.query("UPDATE swap_requests SET status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ message: "Swap request updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;