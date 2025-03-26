const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const path = require('path');

// Get all users
async function getAllUsers(req, res) {
    try {
        const [users] = await pool.query(`
            SELECT id, username, full_name, avatar_url, bio, location, rating
            FROM users
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
}

// Get user profile by ID
async function getUserProfile(req, res) {
    try {
        const [users] = await pool.query(`
            SELECT id, username, full_name, avatar_url, bio, location, rating
            FROM users
            WHERE id = ?
        `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
}

// Get current user's profile (protected route)
async function getMyProfile(req, res) {
    try {
        const [users] = await pool.query(`
            SELECT id, username, full_name, avatar_url, bio, location, rating
            FROM users
            WHERE id = ?
        `, [req.session.userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
}

// Update profile (including avatar upload)
async function updateProfile(req, res) {
    try {
        const { full_name, bio, location } = req.body;
        let avatarPath = null;

        if (req.file) {
            const avatar = req.file;
            avatarPath = `/uploads/avatars/${avatar.filename}`;
        }

        const updateFields = [full_name, bio, location, req.session.userId];
        let query = `
            UPDATE users SET full_name = ?, bio = ?, location = ?
            WHERE id = ?
        `;

        if (avatarPath) {
            query = `
                UPDATE users SET full_name = ?, bio = ?, location = ?, avatar_url = ?
                WHERE id = ?
            `;
            updateFields.splice(3, 0, avatarPath);
        }

        await pool.query(query, updateFields);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
}

// Update user settings (example)
async function updateSettings(req, res) {
    // Assume settings are for things like notifications, password, etc.
    // Update settings logic here
    res.json({ message: 'Settings updated successfully' });
}

// Get user reviews
async function getUserReviews(req, res) {
    try {
        const [reviews] = await pool.query(`
            SELECT * FROM reviews WHERE user_id = ?
        `, [req.params.id]);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
}

// Create user review
async function createReview(req, res) {
    try {
        const { rating, comment } = req.body;

        // Add a review for the user
        const [result] = await pool.query(`
            INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)
        `, [req.params.id, rating, comment]);

        res.json({ message: 'Review added successfully', reviewId: result.insertId });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Error adding review' });
    }
}

// Get user statistics (example: total number of products, reviews, etc.)
async function getUserStats(req, res) {
    try {
        const [stats] = await pool.query(`
            SELECT COUNT(*) AS product_count, SUM(rating) AS total_rating
            FROM products WHERE user_id = ?
        `, [req.params.id]);
        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Error fetching user stats' });
    }
}

module.exports = {
    getAllUsers,
    getUserProfile,
    getMyProfile,
    updateProfile,
    updateSettings,
    getUserReviews,
    createReview,
    getUserStats
};
