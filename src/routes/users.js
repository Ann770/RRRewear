const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');  // Assuming you have a file upload middleware

// Public routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserProfile);

// Protected routes (require authentication)
router.get('/profile/me', auth, userController.getMyProfile);
router.put('/profile/me', auth, upload.single('avatar'), userController.updateProfile);
router.put('/profile/settings', auth, userController.updateSettings);

// User reviews
router.get('/:id/reviews', userController.getUserReviews);
router.post('/:id/reviews', auth, userController.createReview);

// User statistics
router.get('/:id/stats', userController.getUserStats);

module.exports = router;
