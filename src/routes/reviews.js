const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/user/:userId', reviewController.getUserReviews);

// Protected routes (require authentication)
router.post('/product/:productId', auth, reviewController.createProductReview);
router.post('/user/:userId', auth, reviewController.createUserReview);
router.put('/:id', auth, reviewController.updateReview);
router.delete('/:id', auth, reviewController.deleteReview);

// Review statistics
router.get('/stats/product/:productId', reviewController.getProductReviewStats);
router.get('/stats/user/:userId', reviewController.getUserReviewStats);

module.exports = router; 