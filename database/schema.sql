-- Create the database
CREATE DATABASE IF NOT EXISTS rrrewear;
USE rrrewear;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, item_id)
);

-- Brand table
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clothing Items table
CREATE TABLE IF NOT EXISTS clothing_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    brand_id INT,
    category_id INT,
    user_id INT,
    condition VARCHAR(50),
    size VARCHAR(20),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating DECIMAL(3,2) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id),
    FOREIGN KEY (reviewee_id) REFERENCES users(user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
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
    FOREIGN KEY (requester_id) REFERENCES users(user_id),
    FOREIGN KEY (owner_id) REFERENCES users(user_id),
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
    FOREIGN KEY (user_id) REFERENCES users(user_id)
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

INSERT INTO categories (name) VALUES
('Women'),
('Men'),
('Accessories'),
('Shoes'),
('Bags');

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

-- Create indexes for better performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_brand_id ON clothing_items(brand_id);
CREATE INDEX idx_clothing_items_category_id ON clothing_items(category_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_item_id ON reviews(item_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_swap_requests_requester_id ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_owner_id ON swap_requests(owner_id);
CREATE INDEX idx_swap_requests_item_id ON swap_requests(item_id);
CREATE INDEX idx_payments_user_id ON payments(user_id); 