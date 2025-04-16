-- Create database if not exists
CREATE DATABASE IF NOT EXISTS rrrewear;
USE rrrewear;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(100),
    size_preference ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL'),
    style_preferences TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_swaps INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(category_id)
);

-- Clothing Items table
CREATE TABLE IF NOT EXISTS clothing_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    brand_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    size ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL') NOT NULL,
    condition ENUM('new', 'like_new', 'good', 'fair', 'poor') NOT NULL,
    material VARCHAR(100),
    color VARCHAR(50),
    image_url VARCHAR(255) NOT NULL,
    status ENUM('available', 'pending', 'swapped', 'archived') DEFAULT 'available',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Item Images table (for multiple images per item)
CREATE TABLE IF NOT EXISTS item_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id) ON DELETE CASCADE
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, item_id)
);

-- Swap Requests table
CREATE TABLE IF NOT EXISTS swap_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    receiver_id INT NOT NULL,
    requested_item_id INT NOT NULL,
    offered_item_id INT NOT NULL,
    message TEXT,
    delivery_method ENUM('meetup', 'delivery') NOT NULL DEFAULT 'meetup',
    status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id),
    FOREIGN KEY (requested_item_id) REFERENCES clothing_items(item_id),
    FOREIGN KEY (offered_item_id) REFERENCES clothing_items(item_id)
);

-- Swap Messages Table
CREATE TABLE IF NOT EXISTS swap_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES swap_requests(request_id),
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
);

-- Swap History table
CREATE TABLE IF NOT EXISTS swap_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    requester_id INT NOT NULL,
    owner_id INT NOT NULL,
    offered_item_id INT NOT NULL,
    desired_item_id INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES swap_requests(request_id),
    FOREIGN KEY (requester_id) REFERENCES users(user_id),
    FOREIGN KEY (owner_id) REFERENCES users(user_id),
    FOREIGN KEY (offered_item_id) REFERENCES clothing_items(item_id),
    FOREIGN KEY (desired_item_id) REFERENCES clothing_items(item_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    swap_request_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (swap_request_id) REFERENCES swap_requests(request_id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('swap_request', 'message', 'swap_accepted', 'swap_rejected', 'new_follower', 'rating_received') NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    reviewer_id INT NOT NULL,
    reviewed_id INT NOT NULL,
    swap_id INT,
    rating DECIMAL(2,1) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (swap_id) REFERENCES swap_history(history_id)
);

-- User Followers table
CREATE TABLE IF NOT EXISTS followers (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INT PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    privacy_level ENUM('public', 'private', 'friends_only') DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Women', 'Women\'s clothing items'),
('Men', 'Men\'s clothing items'),
('Accessories', 'Fashion accessories'),
('Shoes', 'Footwear'),
('Bags', 'Handbags and backpacks');

-- Insert default brands
INSERT INTO brands (name) VALUES
('Nike'),
('Adidas'),
('Zara'),
('H&M'),
('Uniqlo');

-- Create indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_item_status ON clothing_items(status);
CREATE INDEX idx_item_user ON clothing_items(user_id);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_swap_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_status ON swap_requests(status);
CREATE INDEX idx_message_users ON messages(sender_id, receiver_id);
CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_review_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_followers ON followers(follower_id, following_id); 