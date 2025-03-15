const express = require("express");
const db = require("../../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create a payment intent
router.post("/create-payment-intent", async (req, res) => {
    const { amount, currency } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save transaction details
router.post("/save-transaction", async (req, res) => {
    const { user_id, amount, status } = req.body;
    try {
        await db.query(
            "INSERT INTO transactions (user_id, amount, status) VALUES (?, ?, ?)",
            [user_id, amount, status]
        );
        res.json({ message: "Transaction saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
