const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Payment processing
router.post('/create-payment', paymentController.createPayment);
router.post('/confirm-payment', paymentController.confirmPayment);
router.post('/cancel-payment', paymentController.cancelPayment);

// Payment history
router.get('/history', paymentController.getPaymentHistory);
router.get('/history/:id', paymentController.getPaymentDetails);

// Payment settings
router.get('/settings', paymentController.getPaymentSettings);
router.put('/settings', paymentController.updatePaymentSettings);

// Payment webhooks
router.post('/webhook', paymentController.handleWebhook);

module.exports = router; 