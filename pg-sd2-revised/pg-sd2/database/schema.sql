-- Create the database
CREATE DATABASE IF NOT EXISTS sd2-db;
USE sd2-db;

-- Users table with enhanced profile information
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    points INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSON,
    privacy_settings JSON
);

-- Drop and recreate the users table to ensure correct structure
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    points INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSON,
    privacy_settings JSON
);

-- Brand table
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table with hierarchy support
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INT,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Clothing Items table
CREATE TABLE IF NOT EXISTS clothing_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    brand_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    size VARCHAR(10),
    `condition` VARCHAR(50),
    image_url VARCHAR(255) NOT NULL,
    status ENUM('available', 'pending', 'swapped') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Reviews and ratings table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reviewer_id INT NOT NULL,
    listing_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES clothing_items(item_id) ON DELETE CASCADE
);

-- Messages table for in-app messaging
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    listing_id INT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES clothing_items(item_id) ON DELETE SET NULL
);

-- Delivery Options table
CREATE TABLE IF NOT EXISTS delivery_options (
    delivery_option_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Swap Requests table
CREATE TABLE IF NOT EXISTS swap_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    owner_id INT NOT NULL,
    item_id INT NOT NULL,
    delivery_option_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id),
    FOREIGN KEY (delivery_option_id) REFERENCES delivery_options(delivery_option_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User badges table
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    points_required INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- Forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum topics table
CREATE TABLE IF NOT EXISTS forum_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES forum_categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User impact metrics table
CREATE TABLE IF NOT EXISTS user_impact (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    items_shared INT DEFAULT 0,
    items_received INT DEFAULT 0,
    carbon_saved DECIMAL(10,2) DEFAULT 0,
    money_saved DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (name, email, password, location, size) VALUES
('Diya', 'diya@example.com', '$2b$10$YourHashedPasswordHere', 'Manchester', 'M'),
('Sushmita', 'sushmita@example.com', '$2b$10$YourHashedPasswordHere', 'London', 'S'),
('Sankalpa', 'sankalpa@example.com', '$2b$10$YourHashedPasswordHere', 'London', 'L');

INSERT INTO brands (name) VALUES
('Nike'),
('Adidas'),
('Zara'),
('H&M'),
('Uniqlo');

INSERT INTO categories (name, description) VALUES
('Women', 'Women''s clothing and accessories'),
('Men', 'Men''s clothing and accessories'),
('Accessories', 'General accessories'),
('Shoes', 'Footwear for all genders'),
('Bags', 'Handbags, backpacks, and other bags');

INSERT INTO delivery_options (name, description, price) VALUES
('Pick up and Drop at Home', 'We will collect and deliver directly to your home address', 4.00),
('Pick up and Drop at Pick up Point', 'We will collect and deliver to your chosen pick up point', 2.00);

-- Insert sample clothing items
INSERT INTO clothing_items (user_id, brand_id, category_id, name, description, size, condition, image_url) VALUES
(1, 1, 1, 'Nike Sports Bra', 'Black sports bra in excellent condition', 'M', 'excellent', '/uploads/products/nike-sports-bra.jpg'),
(1, 2, 1, 'Adidas Yoga Pants', 'Grey yoga pants with pockets', 'M', 'good', '/uploads/products/adidas-yoga-pants.jpg'),
(2, 3, 2, 'Zara Denim Jacket', 'Classic fit denim jacket', 'L', 'excellent', '/uploads/products/zara-denim-jacket.jpg'),
(2, 4, 3, 'H&M Scarf', 'Wool blend scarf in navy blue', 'One Size', 'new', '/uploads/products/hm-scarf.jpg'),
(3, 5, 4, 'Uniqlo Sneakers', 'White canvas sneakers', 'UK 7', 'good', '/uploads/products/uniqlo-sneakers.jpg');

-- Insert sample reviews
INSERT INTO reviews (user_id, item_id, reviewee_id, rating, comment) VALUES
(2, 1, 1, 5.00, 'Perfect condition, exactly as described'),
(3, 2, 1, 4.50, 'Great quality, fast delivery'),
(1, 3, 2, 4.00, 'Nice jacket, good condition'),
(3, 4, 2, 5.00, 'Beautiful scarf, brand new'),
(1, 5, 3, 4.50, 'Comfortable sneakers, as described');

-- Insert sample messages
INSERT INTO messages (sender_id, receiver_id, content) VALUES
(1, 2, 'Hi, is the denim jacket still available?'),
(2, 1, 'Yes, it is! Would you like to swap?'),
(2, 3, 'Hello, interested in the scarf?'),
(3, 2, 'Yes, what size is it?');

-- Insert sample swap requests
INSERT INTO swap_requests (requester_id, owner_id, item_id, delivery_option_id, status) VALUES
(1, 2, 3, 1, 'pending'),
(2, 3, 5, 2, 'accepted'),
(3, 1, 1, 3, 'rejected');

-- Insert sample payments
INSERT INTO payments (user_id, amount, method, status) VALUES
(1, 5.99, 'card', 'completed'),
(2, 12.99, 'card', 'pending'),
(3, 0.00, 'cash', 'completed');

-- Insert default badges
INSERT INTO badges (name, description, points_required) VALUES
('New Member', 'Welcome to RRRewear!', 0),
('Active Sharer', 'Shared 5 items', 100),
('Community Helper', 'Helped 10 members', 500),
('Sustainability Champion', 'Shared 20 items', 1000),
('Influencer', 'Received 50 positive reviews', 2000);

-- Insert default forum categories
INSERT INTO forum_categories (name, description) VALUES
('General Discussion', 'General topics and discussions'),
('Tips & Tricks', 'Share your tips and tricks'),
('Success Stories', 'Share your success stories'),
('Help & Support', 'Get help and support from the community');

-- Create indexes for better performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_brand_id ON clothing_items(brand_id);
CREATE INDEX idx_clothing_items_category_id ON clothing_items(category_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_item_id ON reviews(item_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_swap_requests_requester_id ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_owner_id ON swap_requests(owner_id);
CREATE INDEX idx_swap_requests_item_id ON swap_requests(item_id);
CREATE INDEX idx_payments_user_id ON payments(user_id); 