const { pool } = require('../config/database');

class SwapRequest {
  static async create({
    requester_id,
    receiver_id,
    requested_item_id,
    offered_item_id,
    message,
    status = 'pending',
    delivery_method = 'meetup'
  }) {
    const [result] = await pool.query(
      `INSERT INTO swap_requests 
       (requester_id, receiver_id, requested_item_id, offered_item_id, message, status, delivery_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requester_id, receiver_id, requested_item_id, offered_item_id, message, status, delivery_method]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [requests] = await pool.query(
      `SELECT sr.*, 
              r.name as requester_name,
              re.name as receiver_name,
              ri.name as requested_item_name,
              ri.image_url as requested_item_image,
              b1.name as requested_item_brand,
              oi.name as offered_item_name,
              oi.image_url as offered_item_image,
              b2.name as offered_item_brand
       FROM swap_requests sr
       JOIN users r ON sr.requester_id = r.user_id
       JOIN users re ON sr.receiver_id = re.user_id
       JOIN clothing_items ri ON sr.requested_item_id = ri.item_id
       JOIN brands b1 ON ri.brand_id = b1.brand_id
       JOIN clothing_items oi ON sr.offered_item_id = oi.item_id
       JOIN brands b2 ON oi.brand_id = b2.brand_id
       WHERE sr.requester_id = ? OR sr.receiver_id = ?
       ORDER BY sr.created_at DESC`,
      [userId, userId]
    );
    return requests;
  }

  static async findById(id) {
    const [requests] = await pool.query(`
      SELECT sr.*, 
             ci.name as requested_item_name,
             ci.image_url as requested_item_image,
             ci2.name as offered_item_name,
             ci2.image_url as offered_item_image,
             u1.name as requester_name,
             u2.name as receiver_name
      FROM swap_requests sr
      JOIN clothing_items ci ON sr.requested_item_id = ci.item_id
      JOIN clothing_items ci2 ON sr.offered_item_id = ci2.item_id
      JOIN users u1 ON sr.requester_id = u1.user_id
      JOIN users u2 ON sr.receiver_id = u2.user_id
      WHERE sr.request_id = ?
    `, [id]);
    return requests[0];
  }

  static async updateStatus(id, status) {
    await pool.query(
      'UPDATE swap_requests SET status = ? WHERE request_id = ?',
      [status, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM swap_requests WHERE request_id = ?', [id]);
  }

  static async getMessages(requestId) {
    const [messages] = await pool.query(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.swap_request_id = ?
      ORDER BY m.created_at ASC
    `, [requestId]);
    return messages;
  }

  static async addMessage(requestId, senderId, message) {
    const [result] = await pool.query(
      `INSERT INTO messages (swap_request_id, sender_id, message)
       VALUES (?, ?, ?)`,
      [requestId, senderId, message]
    );
    return result.insertId;
  }
}

module.exports = SwapRequest; 