const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Message management
router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:userId', messageController.getConversation);
router.get('/conversations/:userId/messages', messageController.getMessages);
router.put('/messages/:id/read', messageController.markMessageAsRead);

// Message notifications
router.get('/notifications', messageController.getUnreadNotifications);
router.put('/notifications/read', messageController.markAllNotificationsAsRead);

module.exports = router; 