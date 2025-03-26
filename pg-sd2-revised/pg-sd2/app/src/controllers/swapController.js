const { pool } = require('../config/database');

// Create swap request
async function createSwapRequest(req, res) {
    try {
        const { product_id, message } = req.body;

        // Check if product exists and is available
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ? AND status = "available"',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found or not available' });
        }

        const product = products[0];

        // Check if user is not requesting their own product
        if (product.user_id === req.session.userId) {
            return res.status(400).json({ message: 'Cannot request swap for your own product' });
        }

        // Create swap request
        const [result] = await pool.query(
            'INSERT INTO swap_requests (requester_id, product_id, message) VALUES (?, ?, ?)',
            [req.session.userId, product_id, message]
        );

        // Update product status
        await pool.query(
            'UPDATE products SET status = "pending" WHERE id = ?',
            [product_id]
        );

        // Create notification for product owner
        await pool.query(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, "swap_request", ?)',
            [product.user_id, `New swap request for your product "${product.name}"`]
        );

        res.status(201).json({
            message: 'Swap request created successfully',
            requestId: result.insertId
        });
    } catch (error) {
        console.error('Error creating swap request:', error);
        res.status(500).json({ message: 'Error creating swap request' });
    }
}

// Get swap requests for user's products
async function getMySwapRequests(req, res) {
    try {
        const [requests] = await pool.query(`
            SELECT sr.*, 
                   p.name as product_name, p.image_url,
                   u.username as requester_name
            FROM swap_requests sr
            JOIN products p ON sr.product_id = p.id
            JOIN users u ON sr.requester_id = u.id
            WHERE p.user_id = ?
        `, [req.session.userId]);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching received swap requests:', error);
        res.status(500).json({ message: 'Error fetching swap requests' });
    }
}

// Accept swap request
async function acceptSwapRequest(req, res) {
    try {
        const [requests] = await pool.query(`
            SELECT sr.*, p.user_id as product_owner_id, p.name as product_name
            FROM swap_requests sr
            JOIN products p ON sr.product_id = p.id
            WHERE sr.id = ?
        `, [req.params.id]);

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Swap request not found' });
        }

        const request = requests[0];

        if (request.product_owner_id !== req.session.userId) {
            return res.status(403).json({ message: 'Not authorized to accept this request' });
        }

        await pool.query(
            'UPDATE swap_requests SET status = "accepted" WHERE id = ?',
            [req.params.id]
        );

        await pool.query(
            'UPDATE products SET status = "swapped" WHERE id = ?',
            [request.product_id]
        );

        await pool.query(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, "swap_accepted", ?)',
            [request.requester_id, `Your swap request for "${request.product_name}" has been accepted`]
        );

        res.json({ message: 'Swap request accepted successfully' });
    } catch (error) {
        console.error('Error accepting swap request:', error);
        res.status(500).json({ message: 'Error accepting swap request' });
    }
}

// Reject swap request
async function rejectSwapRequest(req, res) {
    try {
        const [requests] = await pool.query(`
            SELECT sr.*, p.user_id as product_owner_id, p.name as product_name
            FROM swap_requests sr
            JOIN products p ON sr.product_id = p.id
            WHERE sr.id = ?
        `, [req.params.id]);

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Swap request not found' });
        }

        const request = requests[0];

        if (request.product_owner_id !== req.session.userId) {
            return res.status(403).json({ message: 'Not authorized to reject this request' });
        }

        await pool.query(
            'UPDATE swap_requests SET status = "rejected" WHERE id = ?',
            [req.params.id]
        );

        await pool.query(
            'UPDATE products SET status = "available" WHERE id = ?',
            [request.product_id]
        );

        await pool.query(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, "swap_rejected", ?)',
            [request.requester_id, `Your swap request for "${request.product_name}" has been rejected`]
        );

        res.json({ message: 'Swap request rejected successfully' });
    } catch (error) {
        console.error('Error rejecting swap request:', error);
        res.status(500).json({ message: 'Error rejecting swap request' });
    }
}

module.exports = {
    createSwapRequest,
    getMySwapRequests,
    acceptSwapRequest,
    rejectSwapRequest
};
