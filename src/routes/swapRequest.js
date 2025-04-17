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
      offered_items,
      new_item_name,
      new_item_brand,
      new_item_category,
      new_item_size,
      new_item_condition,
      new_item_description,
      message,
      delivery_method,
      shipping_address,
      meetup_location,
      meetup_date
    } = req.body;

    if (!requested_item_id || !delivery_method) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect(`/swap-requests/new?item_id=${requested_item_id}`);
    }

    // Get the receiver_id from the requested item
    const [item] = await pool.query(
      'SELECT user_id FROM clothing_items WHERE item_id = ?',
      [requested_item_id]
    );

    if (!item || item.length === 0) {
      req.flash('error_msg', 'Requested item not found');
      return res.redirect('/products');
    }

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      let offeredItemIds = [];

      // Handle new item if provided
      if (new_item_name) {
        const [newItem] = await pool.query(
          `INSERT INTO clothing_items 
           (user_id, name, brand_id, category_id, size, condition, description, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
          [
            req.session.user.user_id,
            new_item_name,
            new_item_brand,
            new_item_category,
            new_item_size,
            new_item_condition,
            new_item_description
          ]
        );
        offeredItemIds.push(newItem.insertId);
      }

      // Add existing items if selected
      if (offered_items && offered_items.length > 0) {
        offeredItemIds = [...offeredItemIds, ...offered_items];
      }

      // Create swap request for each offered item
      for (const offered_item_id of offeredItemIds) {
        await SwapRequest.create({
          requester_id: req.session.user.user_id,
          receiver_id: item[0].user_id,
          requested_item_id,
          offered_item_id,
          message,
          delivery_method,
          shipping_address: delivery_method === 'shipping' ? shipping_address : null,
          meetup_location: delivery_method === 'meetup' ? meetup_location : null,
          meetup_date: delivery_method === 'meetup' ? meetup_date : null
        });
      }

      // Create notification for the receiver
      await pool.query(
        `INSERT INTO notifications 
         (user_id, type, message, related_id)
         VALUES (?, 'swap_request', 'New swap request received', ?)`,
        [item[0].user_id, requested_item_id]
      );

      await pool.query('COMMIT');

      req.flash('success_msg', 'Swap request sent successfully');
      res.redirect('/swap-requests');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating swap request:', error);
    req.flash('error_msg', 'Error creating swap request');
    res.redirect('/products');
  }
});

// Get all swap requests for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get swap requests where user is either requester or receiver
    const [requests] = await pool.query(`
      SELECT 
        sr.*,
        ci.name as requested_item_name,
        ci.image_url as requested_item_image,
        u1.name as requester_name,
        u2.name as receiver_name
      FROM swap_requests sr
      JOIN clothing_items ci ON sr.requested_item_id = ci.item_id
      JOIN users u1 ON sr.requester_id = u1.user_id
      JOIN users u2 ON ci.user_id = u2.user_id
      WHERE sr.requester_id = ? OR ci.user_id = ?
      ORDER BY sr.created_at DESC
    `, [req.session.user.user_id, req.session.user.user_id]);

    // Get offered items for each request
    for (const request of requests) {
      const [offeredItems] = await pool.query(`
        SELECT ci.*, b.name as brand_name, c.name as category_name
        FROM clothing_items ci
        JOIN brands b ON ci.brand_id = b.brand_id
        JOIN categories c ON ci.category_id = c.category_id
        WHERE ci.item_id = ?
      `, [request.offered_item_id]);

      request.offered_items = offeredItems;
    }

    res.render('swap-requests/index', {
      title: 'Swap Requests',
      requests: requests || [],
      user: req.session.user
    });
  } catch (err) {
    console.error('Error fetching swap requests:', err);
    req.flash('error_msg', 'Error loading swap requests');
    res.redirect('/products');
  }
});

// Get new swap request form
router.get('/new', isAuthenticated, async (req, res) => {
  try {
    const { item_id } = req.query;
    
    if (!item_id) {
      req.flash('error_msg', 'No item specified for swap');
      return res.redirect('/products');
    }

    // Get the requested item details
    const [requestedItems] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      JOIN users u ON ci.user_id = u.user_id
      WHERE ci.item_id = ?
    `, [item_id]);

    if (!requestedItems || requestedItems.length === 0) {
      req.flash('error_msg', 'Item not found');
      return res.redirect('/products');
    }

    const requestedItem = requestedItems[0];

    // Get user's items that they can offer
    const [userItems] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      WHERE ci.user_id = ? 
      AND ci.item_id NOT IN (
        SELECT item_id FROM swap_requests 
        WHERE status = 'accepted'
      )
    `, [req.session.user.user_id]);

    // Get categories and brands for new item form
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    const [brands] = await pool.query('SELECT * FROM brands ORDER BY name');

    res.render('swap-requests/new', {
      title: 'New Swap Request',
      requestedItem,
      userItems: userItems || [],
      categories,
      brands,
      user: req.session.user
    });
  } catch (err) {
    console.error('Error loading swap request form:', err);
    req.flash('error_msg', 'Error loading swap request form');
    res.redirect('/products');
  }
});

// Get a specific swap request
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const request = await SwapRequest.findById(req.params.id);
    
    if (!request) {
      req.flash('error_msg', 'Swap request not found');
      return res.redirect('/swap-requests');
    }

    // Check if user is authorized to view this request
    if (request.requester_id !== req.session.user.user_id && request.receiver_id !== req.session.user.user_id) {
      req.flash('error_msg', 'You are not authorized to view this swap request');
      return res.redirect('/swap-requests');
    }

    // Get messages for this request
    const messages = await SwapRequest.getMessages(req.params.id);

    res.render('swap-requests/show', {
      title: 'Swap Request Details',
      user: req.session.user,
      request,
      messages
    });
  } catch (error) {
    console.error('Error fetching swap request:', error);
    req.flash('error_msg', 'Error fetching swap request details');
    res.redirect('/swap-requests');
  }
});

// Update swap request status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get the swap request
    const [request] = await pool.query(
      `SELECT sr.*, ci.user_id as owner_id
       FROM swap_requests sr
       JOIN clothing_items ci ON sr.requested_item_id = ci.item_id
       WHERE sr.request_id = ?`,
      [id]
    );

    if (!request || request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is authorized to update status
    if (request[0].owner_id !== req.session.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this swap request'
      });
    }

    // Update status
    await pool.query(
      'UPDATE swap_requests SET status = ? WHERE request_id = ?',
      [status, id]
    );

    // Send notification to the requester
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_id)
       VALUES (?, 'swap_status', 'Your swap request has been ${status}', ?)`,
      [request[0].requester_id, id]
    );

    res.json({
      success: true,
      message: `Swap request ${status} successfully`
    });
  } catch (err) {
    console.error('Error updating swap request status:', err);
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
    if (request.requester_id !== req.session.user.user_id && request.receiver_id !== req.session.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add messages to this swap request'
      });
    }

    const messageId = await SwapRequest.addMessage(req.params.id, req.session.user.user_id, message);
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
    const { id } = req.params;

    // Get the swap request
    const [request] = await pool.query(
      'SELECT * FROM swap_requests WHERE request_id = ?',
      [id]
    );

    if (!request || request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is authorized to delete
    if (request[0].requester_id !== req.session.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this swap request'
      });
    }

    // Delete swap request
    await SwapRequest.delete(id);

    res.json({
      success: true,
      message: 'Swap request deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting swap request:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting swap request'
    });
  }
});

// GET /swap-requests/available - Show items available for swap
router.get('/available', isAuthenticated, async (req, res) => {
  try {
    // Get all items except user's own items
    const [items] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      JOIN users u ON ci.user_id = u.user_id
      WHERE ci.user_id != ?
      AND ci.item_id NOT IN (
        SELECT item_id FROM swap_requests 
        WHERE status = 'accepted'
      )
      ORDER BY ci.created_at DESC
    `, [req.session.user.user_id]);

    res.render('swap-requests/available', {
      title: 'Items Available for Swap',
      user: req.session.user,
      items: items || []
    });
  } catch (err) {
    console.error('Error fetching available items:', err);
    req.flash('error_msg', 'Error loading available items');
    res.redirect('/products');
  }
});

// GET /requestswap/:itemId - Show new swap request form
router.get('/requestswap/:itemId', isAuthenticated, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Get the requested item details
    const [requestedItem] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      JOIN users u ON ci.user_id = u.user_id
      WHERE ci.item_id = ?
    `, [itemId]);

    if (!requestedItem || requestedItem.length === 0) {
      req.flash('error_msg', 'Item not found');
      return res.redirect('/products');
    }

    // Get user's items that they can offer
    const [userItems] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      WHERE ci.user_id = ? 
      AND ci.item_id NOT IN (
        SELECT item_id FROM swap_requests 
        WHERE status = 'accepted'
      )
    `, [req.session.user.user_id]);

    // Get user's address for shipping
    const [userAddress] = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = ?',
      [req.session.user.user_id]
    );

    res.render('swap-requests/new', {
      title: 'Request Swap',
      requestedItem: requestedItem[0],
      userItems: userItems || [],
      userAddress: userAddress[0],
      user: req.session.user
    });
  } catch (err) {
    console.error('Error in swap request form:', err);
    req.flash('error_msg', 'Error loading swap request form');
    res.redirect('/products');
  }
});

// POST /swap-requests - Create new swap request
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { requested_item_id, offered_item_id, message } = req.body;

    if (!requested_item_id || !offered_item_id) {
      req.flash('error_msg', 'Please select both items for the swap');
      return res.redirect('/swap-requests/available');
    }

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      // Get the owner of the requested item
      const [item] = await pool.query(
        'SELECT user_id FROM clothing_items WHERE item_id = ?',
        [requested_item_id]
      );

      if (!item || item.length === 0) {
        await pool.query('ROLLBACK');
        req.flash('error_msg', 'Requested item not found');
        return res.redirect('/swap-requests/available');
      }

      // Verify the offered item belongs to the requester
      const [offeredItem] = await pool.query(
        'SELECT user_id FROM clothing_items WHERE item_id = ?',
        [offered_item_id]
      );

      if (!offeredItem || offeredItem.length === 0 || offeredItem[0].user_id !== req.session.user.user_id) {
        await pool.query('ROLLBACK');
        req.flash('error_msg', 'Invalid offered item');
        return res.redirect('/swap-requests/available');
      }

      // Create the swap request
      const [result] = await pool.query(
        `INSERT INTO swap_requests 
         (requester_id, receiver_id, item_id, message, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [req.session.user.user_id, item[0].user_id, requested_item_id, message]
      );

      const requestId = result.insertId;

      // Create swap tracking record
      await pool.query(
        `INSERT INTO swap_tracking 
         (swap_request_id, sender_confirmed, receiver_confirmed)
         VALUES (?, 0, 0)`,
        [requestId]
      );

      // Send notification to the item owner
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_id)
         VALUES (?, 'swap_request', 'New swap request for your item', ?)`,
        [item[0].user_id, requestId]
      );

      await pool.query('COMMIT');

      req.flash('success_msg', 'Swap request created successfully');
      res.redirect('/swap-requests');
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Error in transaction:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error creating swap request:', err);
    req.flash('error_msg', 'Error creating swap request');
    res.redirect('/swap-requests/available');
  }
});

// POST /swap-requests/:id/accept - Accept swap request
router.post('/:id/accept', isAuthenticated, async (req, res) => {
  try {
    const [request] = await pool.query(
      'SELECT * FROM swap_requests WHERE request_id = ?',
      [req.params.id]
    );

    if (!request || request.length === 0) {
      req.flash('error_msg', 'Swap request not found');
      return res.redirect('/swap-requests');
    }

    if (request[0].receiver_id !== req.session.user.user_id) {
      req.flash('error_msg', 'You are not authorized to accept this swap request');
      return res.redirect('/swap-requests');
    }

    await pool.query(
      'UPDATE swap_requests SET status = "accepted" WHERE request_id = ?',
      [req.params.id]
    );

    // Send notification to the requester
    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_id)
       VALUES (?, 'swap_status', 'Your swap request has been accepted', ?)`,
      [request[0].requester_id, req.params.id]
    );

    req.flash('success_msg', 'Swap request accepted successfully');
    res.redirect(`/swap-requests/${req.params.id}`);
  } catch (error) {
    console.error('Error accepting swap request:', error);
    req.flash('error_msg', 'Error accepting swap request');
    res.redirect('/swap-requests');
  }
});

// POST /swap-requests/:id/reject - Reject swap request
router.post('/:id/reject', isAuthenticated, async (req, res) => {
  try {
    const [request] = await pool.query(
      'SELECT * FROM swap_requests WHERE request_id = ?',
      [req.params.id]
    );

    if (!request || request.length === 0) {
      req.flash('error_msg', 'Swap request not found');
      return res.redirect('/swap-requests');
    }

    if (request[0].receiver_id !== req.session.user.user_id) {
      req.flash('error_msg', 'You are not authorized to reject this swap request');
      return res.redirect('/swap-requests');
    }

    await pool.query(
      'UPDATE swap_requests SET status = "declined" WHERE request_id = ?',
      [req.params.id]
    );

    // Send notification to the requester
    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_id)
       VALUES (?, 'swap_status', 'Your swap request has been declined', ?)`,
      [request[0].requester_id, req.params.id]
    );

    req.flash('success_msg', 'Swap request declined successfully');
    res.redirect('/swap-requests');
  } catch (error) {
    console.error('Error rejecting swap request:', error);
    req.flash('error_msg', 'Error rejecting swap request');
    res.redirect('/swap-requests');
  }
});

// Find similar items for a user's listed items
router.get('/similar-items', isAuthenticated, async (req, res) => {
  try {
    // Get user's listed items
    const [userItems] = await pool.query(`
      SELECT ci.*, b.name as brand_name, c.name as category_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      WHERE ci.user_id = ?
    `, [req.session.user.user_id]);

    // For each user item, find similar items from other users
    const similarItems = [];
    for (const userItem of userItems) {
      const [items] = await pool.query(`
        SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
        FROM clothing_items ci
        JOIN brands b ON ci.brand_id = b.brand_id
        JOIN categories c ON ci.category_id = c.category_id
        JOIN users u ON ci.user_id = u.user_id
        WHERE ci.user_id != ? 
        AND ci.category_id = ?
        AND ci.item_id != ?
        AND ci.item_id NOT IN (
          SELECT item_id FROM swap_requests 
          WHERE requester_id = ? OR receiver_id = ?
        )
        ORDER BY 
          CASE 
            WHEN ci.brand_id = ? THEN 1
            WHEN ci.size = ? THEN 2
            WHEN ci.material = ? THEN 3
            ELSE 4
          END
        LIMIT 5
      `, [
        req.session.user.user_id,
        userItem.category_id,
        userItem.item_id,
        req.session.user.user_id,
        req.session.user.user_id,
        userItem.brand_id,
        userItem.size,
        userItem.material
      ]);

      if (items.length > 0) {
        similarItems.push({
          user_item: userItem,
          similar_items: items
        });
      }
    }

    res.render('swap-requests/similar-items', {
      title: 'Similar Items for Swap',
      user: req.session.user,
      similarItems
    });
  } catch (err) {
    console.error('Error finding similar items:', err);
    req.flash('error_msg', 'Error finding similar items');
    res.redirect('/products');
  }
});

module.exports = router; 