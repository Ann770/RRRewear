const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/db');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/avatars/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// Get profile page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const query = 'SELECT * FROM users WHERE user_id = ?';
        db.query(query, [req.session.user.id], (err, results) => {
            if (err) {
                console.error('Error fetching profile:', err);
                return res.status(500).send('Error loading profile');
            }
            if (results.length === 0) {
                return res.status(404).send('User not found');
            }
            res.render('profile', { user: results[0] });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading profile');
    }
});

// Update profile information
router.post('/edit', isAuthenticated, async (req, res) => {
    try {
        const { name, location, email } = req.body;
        console.log('Received update request:', { name, location, email, userId: req.session.user.id });
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if email is already taken by another user
        const checkEmailQuery = 'SELECT user_id FROM users WHERE email = ? AND user_id != ?';
        db.query(checkEmailQuery, [email, req.session.user.id], (err, results) => {
            if (err) {
                console.error('Error checking email:', err);
                return res.status(500).json({ success: false, message: 'Error checking email availability' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }

            // Update user profile
            const updateQuery = 'UPDATE users SET name = ?, location = ?, email = ? WHERE user_id = ?';
            db.query(updateQuery, [name, location, email, req.session.user.id], (err, result) => {
                if (err) {
                    console.error('Error updating profile:', err);
                    return res.status(500).json({ success: false, message: 'Error updating profile' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                // Get updated user data
                const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
                db.query(getUserQuery, [req.session.user.id], (err, results) => {
                    if (err) {
                        console.error('Error fetching updated user:', err);
                        return res.status(500).json({ success: false, message: 'Error fetching updated profile' });
                    }

                    // Update session data
                    req.session.user = {
                        ...req.session.user,
                        name,
                        location,
                        email
                    };

                    console.log('Profile updated successfully:', results[0]);
                    res.json({ success: true, user: results[0] });
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

// Update profile picture
router.post('/me', isAuthenticated, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const avatarPath = '/uploads/avatars/' + req.file.filename;
        
        const updateQuery = 'UPDATE users SET avatar_url = ? WHERE user_id = ?';
        db.query(updateQuery, [avatarPath, req.session.user.id], (err, result) => {
            if (err) {
                console.error('Error updating avatar:', err);
                return res.status(500).json({ success: false, message: 'Error updating avatar' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Update session data
            req.session.user.avatar_url = avatarPath;

            res.json({ success: true, avatar: avatarPath });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error updating avatar' });
    }
});

module.exports = router; 