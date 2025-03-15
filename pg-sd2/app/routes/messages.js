const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// Get all messages between two users
router.get("/:user1/:user2", async (req, res) => {
    try {
        const messages = await db.query(
            "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at",
            [req.params.user1, req.params.user2, req.params.user2, req.params.user1]
        );
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send a new message
router.post("/send", async (req, res) => {
    const { sender_id, receiver_id, message } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
            [sender_id, receiver_id, message]
        );
        res.json({ message: "Message sent successfully", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
