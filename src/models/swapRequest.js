const { pool } = require('../config/database');

class SwapRequest {
  static async create({
    requester_id,
    receiver_id,
    requested_item_id,
    offered_item_id,
    message,
    delivery_method,
    status = 'pending'
  }) {
    const [result] = await pool.query(
      `INSERT INTO swap_requests 
       (requester_id, receiver_id, requested_item_id, offered_item_id, message, delivery_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requester_id, receiver_id, requested_item_id, offered_item_id, message, delivery_method, status]
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
  
  static async findByUserId(userId) {
    const [requests] = await pool.query(
      `SELECT sr.*, 
              r.name as requester_name,
              re.name as receiver_name,
              ri.name as requested_item_name,
              ri.image_url as requested_item_image,
              ri.brand_name as requested_item_brand,
              oi.name as offered_item_name,
              oi.image_url as offered_item_image,
              oi.brand_name as offered_item_brand
       FROM swap_requests sr
       JOIN users r ON sr.requester_id = r.user_id
       JOIN users re ON sr.receiver_id = re.user_id
       JOIN clothing_items ri ON sr.requested_item_id = ri.item_id
       JOIN clothing_items oi ON sr.offered_item_id = oi.item_id
       WHERE sr.requester_id = ? OR sr.receiver_id = ?
       ORDER BY sr.created_at DESC`,
      [userId, userId]
    );
    return requests;
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
    const [messages] = await pool.query(
      `SELECT m.*, u.name as sender_name
       FROM swap_messages m
       JOIN users u ON m.sender_id = u.user_id
       WHERE m.request_id = ?
       ORDER BY m.created_at ASC`,
      [requestId]
    );
    return messages;
  }

  static async addMessage(requestId, senderId, message) {
    const [result] = await pool.query(
      `INSERT INTO swap_messages (request_id, sender_id, message)
       VALUES (?, ?, ?)`,
      [requestId, senderId, message]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [requests] = await pool.query(
      `SELECT sr.*, 
              r.name as requester_name,
              r.email as requester_email,
              re.name as receiver_name,
              re.email as receiver_email,
              ri.name as requested_item_name,
              ri.image_url as requested_item_image,
              b1.name as requested_item_brand,
              ri.size as requested_item_size,
              ri.item_condition as requested_item_condition,
              oi.name as offered_item_name,
              oi.image_url as offered_item_image,
              b2.name as offered_item_brand,
              oi.size as offered_item_size,
              oi.item_condition as offered_item_condition
       FROM swap_requests sr
       JOIN users r ON sr.requester_id = r.user_id
       JOIN clothing_items ri ON sr.requested_item_id = ri.item_id
       JOIN users re ON ri.user_id = re.user_id
       JOIN clothing_items oi ON sr.offered_item_id = oi.item_id
       JOIN brands b1 ON ri.brand_id = b1.brand_id
       JOIN brands b2 ON oi.brand_id = b2.brand_id
       WHERE sr.request_id = ?`,
      [id]
    );
    return requests[0];
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
       JOIN clothing_items ri ON sr.requested_item_id = ri.item_id
       JOIN users re ON ri.user_id = re.user_id
       JOIN clothing_items oi ON sr.offered_item_id = oi.item_id
       JOIN brands b1 ON ri.brand_id = b1.brand_id
       JOIN brands b2 ON oi.brand_id = b2.brand_id
       WHERE sr.requester_id = ? OR ri.user_id = ?
       ORDER BY sr.created_at DESC`,
      [userId, userId]
    );
    return requests;
  }
}

module.exports = SwapRequest; 