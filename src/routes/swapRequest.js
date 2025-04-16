const express = require('express');
const router = express.Router();
const SwapRequest = require('../models/swapRequest');
const { isAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/database');

// Create a new swap request
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      requested_item_id,
      offered_item_id,
      message,
      delivery_method
    } = req.body;

    // Get the receiver_id from the requested item
    const [item] = await pool.query(
      'SELECT user_id FROM clothing_items WHERE item_id = ?',
      [requested_item_id]
    );

    if (!item || item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Requested item not found'
      });
    }

    const requestId = await SwapRequest.create({
      requester_id: req.user.user_id,
      receiver_id: item[0].user_id,
      requested_item_id,
      offered_item_id,
      message,
      delivery_method
    });

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      requestId
    });
  } catch (error) {
    console.error('Error creating swap request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating swap request'
    });
  }
});

// Get all swap requests for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const requests = await SwapRequest.findByUserId(req.user.user_id);
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching swap requests'
    });
  }
});

// Get a specific swap request
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const request = await SwapRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if the user is either the requester or receiver
    if (request.requester_id !== req.user.user_id && request.receiver_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this swap request'
      });
    }

    const messages = await SwapRequest.getMessages(req.params.id);

    res.json({
      success: true,
      request,
      messages
    });
  } catch (error) {
    console.error('Error fetching swap request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching swap request'
    });
  }
});

// Update swap request status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await SwapRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Only the receiver can update the status
    if (request.receiver_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this swap request'
      });
    }

    await SwapRequest.updateStatus(req.params.id, status);
    res.json({
      success: true,
      message: 'Swap request status updated successfully'
    });
  } catch (error) {
    console.error('Error updating swap request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating swap request status'
    });
  }
});

// Add a message to a swap request
router.post('/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const { message } = req.body;
    const request = await SwapRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if the user is either the requester or receiver
    if (request.requester_id !== req.user.user_id && request.receiver_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add messages to this swap request'
      });
    }

    const messageId = await SwapRequest.addMessage(req.params.id, req.user.user_id, message);
    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      messageId
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding message'
    });
  }
});

// Delete a swap request
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const request = await SwapRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Only the requester can delete the request
    if (request.requester_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this swap request'
      });
    }

    await SwapRequest.delete(req.params.id);
    res.json({
      success: true,
      message: 'Swap request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting swap request:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting swap request'
    });
  }
});

// Get form for new swap request
router.get('/new', isAuthenticated, async (req, res) => {
  try {
    const { item_id } = req.query;
    
    // Get the requested item details
    const [items] = await pool.query(
      `SELECT ci.*, u.name as owner_name, b.name as brand_name
       FROM clothing_items ci
       JOIN users u ON ci.user_id = u.user_id
       JOIN brands b ON ci.brand_id = b.brand_id
       WHERE ci.item_id = ?`,
      [item_id]
    );

    if (!items || items.length === 0) {
      req.flash('error_msg', 'Item not found');
      return res.redirect('/products');
    }

    const requestedItem = items[0];

    // Get the user's items for offering
    const [userItems] = await pool.query(
      `SELECT ci.*, b.name as brand_name
       FROM clothing_items ci
       JOIN brands b ON ci.brand_id = b.brand_id
       WHERE ci.user_id = ?`,
      [req.user.user_id]
    );

    res.render('swap-requests/new', {
      title: 'Create Swap Request',
      requestedItem,
      userItems,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading swap request form:', error);
    req.flash('error_msg', 'Error loading swap request form');
    res.redirect('/products');
  }
});

module.exports = router; 