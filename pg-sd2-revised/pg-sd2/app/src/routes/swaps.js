const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Swap request management
router.post('/request', swapController.createSwapRequest);
router.get('/requests', swapController.getMySwapRequests);
router.get('/requests/:id', swapController.getSwapRequestDetails);
router.put('/requests/:id/accept', swapController.acceptSwapRequest);
router.put('/requests/:id/reject', swapController.rejectSwapRequest);
router.put('/requests/:id/cancel', swapController.cancelSwapRequest);

// Swap history
router.get('/history', swapController.getSwapHistory);
router.get('/history/:id', swapController.getSwapHistoryDetails);

// Swap statistics
router.get('/stats', swapController.getSwapStats);

module.exports = router; 