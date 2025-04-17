const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/database');

// Toggle item in wishlist
router.post('/toggle', isAuthenticated, async (req, res) => {
  try {
    const { item_id } = req.body;
    const user_id = req.session.user.user_id;

    // Check if item exists in wishlist
    const [existing] = await pool.query(
      'SELECT * FROM wishlist WHERE user_id = ? AND item_id = ?',
      [user_id, item_id]
    );

    if (existing.length > 0) {
      // Remove from wishlist
      await pool.query(
        'DELETE FROM wishlist WHERE user_id = ? AND item_id = ?',
        [user_id, item_id]
      );
    } else {
      // Add to wishlist
      await pool.query(
        'INSERT INTO wishlist (user_id, item_id) VALUES (?, ?)',
        [user_id, item_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
});

// Get user's wishlist
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user_id = req.session.user.user_id;

    const [items] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
      FROM wishlist w
      JOIN clothing_items ci ON w.item_id = ci.item_id
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      JOIN users u ON ci.user_id = u.user_id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [user_id]);

    res.render('wishlist', {
      title: 'My Wishlist',
      items,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    req.flash('error_msg', 'Failed to load wishlist');
    res.redirect('/');
  }
});

module.exports = router; 