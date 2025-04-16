const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/db');

// Get user's wishlist
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const query = `
            SELECT w.*, c.*, b.name as brand_name, cat.name as category_name, u.name as owner_name
            FROM wishlist w
            JOIN clothing_items c ON w.item_id = c.item_id
            JOIN brands b ON c.brand_id = b.brand_id
            JOIN categories cat ON c.category_id = cat.category_id
            JOIN users u ON c.user_id = u.user_id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;
        
        db.query(query, [req.session.user.id], (err, results) => {
            if (err) {
                console.error('Error fetching wishlist:', err);
                return res.status(500).json({ success: false, message: 'Error loading wishlist' });
            }
            res.render('wishlist', { items: results });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error loading wishlist' });
    }
});

// Add item to wishlist
router.post('/add/:itemId', isAuthenticated, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const userId = req.session.user.id;

        // Check if item exists and is available
        const checkItemQuery = 'SELECT * FROM clothing_items WHERE item_id = ? AND status = "available"';
        db.query(checkItemQuery, [itemId], (err, results) => {
            if (err) {
                console.error('Error checking item:', err);
                return res.status(500).json({ success: false, message: 'Error adding to wishlist' });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'Item not found or not available' });
            }

            // Add to wishlist
            const addToWishlistQuery = 'INSERT IGNORE INTO wishlist (user_id, item_id) VALUES (?, ?)';
            db.query(addToWishlistQuery, [userId, itemId], (err, result) => {
                if (err) {
                    console.error('Error adding to wishlist:', err);
                    return res.status(500).json({ success: false, message: 'Error adding to wishlist' });
                }

                if (result.affectedRows === 0) {
                    return res.status(400).json({ success: false, message: 'Item already in wishlist' });
                }

                res.json({ success: true, message: 'Item added to wishlist' });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error adding to wishlist' });
    }
});

// Remove item from wishlist
router.post('/remove/:itemId', isAuthenticated, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const userId = req.session.user.id;

        const query = 'DELETE FROM wishlist WHERE user_id = ? AND item_id = ?';
        db.query(query, [userId, itemId], (err, result) => {
            if (err) {
                console.error('Error removing from wishlist:', err);
                return res.status(500).json({ success: false, message: 'Error removing from wishlist' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
            }

            res.json({ success: true, message: 'Item removed from wishlist' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error removing from wishlist' });
    }
});

// Check if item is in wishlist
router.get('/check/:itemId', isAuthenticated, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const userId = req.session.user.id;

        const query = 'SELECT * FROM wishlist WHERE user_id = ? AND item_id = ?';
        db.query(query, [userId, itemId], (err, results) => {
            if (err) {
                console.error('Error checking wishlist:', err);
                return res.status(500).json({ success: false, message: 'Error checking wishlist' });
            }

            res.json({ success: true, inWishlist: results.length > 0 });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error checking wishlist' });
    }
});

module.exports = router; 