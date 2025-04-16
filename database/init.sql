-- Create root user with proper permissions
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'fakepassword';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS rrrewear;
USE rrrewear;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    size VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Brand table
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    condition VARCHAR(20),
    material VARCHAR(50),
    color VARCHAR(50),
    image_url VARCHAR(255),
    status ENUM('available', 'pending', 'swapped') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
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
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
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
    FOREIGN KEY (delivery_option_id) REFERENCES delivery_options(option_id)
);

-- Insert sample data
INSERT INTO users (name, email, password, location, size) VALUES
('Diya', 'diya@example.com', '$2b$10$YourHashedPasswordHere', 'Manchester', 'M'),
('Sushmita', 'sushmita@example.com', '$2b$10$YourHashedPasswordHere', 'London', 'S'),
('Sankalpa', 'sankalpa@example.com', '$2b$10$YourHashedPasswordHere', 'London', 'L');

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Tops', 'Shirts, blouses, t-shirts, and other upper body garments'),
('Bottoms', 'Pants, skirts, shorts, and other lower body garments'),
('Dresses', 'One-piece garments'),
('Outerwear', 'Jackets, coats, and other outer garments'),
('Shoes', 'Footwear of all types'),
('Accessories', 'Bags, jewelry, belts, and other accessories');

-- Insert default brands
INSERT INTO brands (name) VALUES
('Nike'),
('Adidas'),
('Zara'),
('H&M'),
('Uniqlo'),
('Levi''s'),
('Gap'),
('Puma'),
('Under Armour'),
('Other');

-- Insert default delivery options
INSERT INTO delivery_options (name, description) VALUES
('Local Pickup', 'Meet in person to exchange items'),
('Standard Shipping', 'Standard postal service delivery'),
('Express Shipping', 'Fast delivery service');

-- Insert sample clothing items
INSERT INTO clothing_items (user_id, brand_id, category_id, name, description, size, condition, image_url) VALUES
(1, 1, 1, 'Nike Sports Bra', 'Black sports bra in excellent condition', 'M', 'excellent', '/uploads/products/nike-sports-bra.jpg'),
(1, 2, 1, 'Adidas Yoga Pants', 'Grey yoga pants with pockets', 'M', 'good', '/uploads/products/adidas-yoga-pants.jpg'),
(2, 3, 2, 'Zara Denim Jacket', 'Classic fit denim jacket', 'L', 'excellent', '/uploads/products/zara-denim-jacket.jpg'),
(2, 4, 3, 'H&M Scarf', 'Wool blend scarf in navy blue', 'One Size', 'new', '/uploads/products/hm-scarf.jpg'),
(3, 5, 4, 'Uniqlo Sneakers', 'White canvas sneakers', 'UK 7', 'good', '/uploads/products/uniqlo-sneakers.jpg');

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

-- Create swaps table
CREATE TABLE IF NOT EXISTS swaps (
    swap_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    requester_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES clothing_items(item_id),
    FOREIGN KEY (requester_id) REFERENCES users(user_id)
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create listing_tags table
CREATE TABLE IF NOT EXISTS listing_tags (
    listing_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (listing_id, tag_id),
    FOREIGN KEY (listing_id) REFERENCES clothing_items(item_id),
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

-- Insert some common tags
INSERT INTO tags (name) VALUES
('Casual'),
('Formal'),
('Vintage'),
('Streetwear'),
('Sports'),
('Summer'),
('Winter'),
('Spring'),
('Fall'),
('Plus Size'),
('Petite'),
('Maternity');

-- Insert sample admin user
INSERT INTO users (username, email, password, name, role) VALUES
('admin', 'admin@rrrewear.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin');

-- Insert sample brands
INSERT INTO brands (name, description) VALUES
('Nike', 'Just Do It'),
('Adidas', 'Impossible is Nothing'),
('Puma', 'Forever Faster'),
('Under Armour', 'I Will');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('T-Shirts', 'Casual and comfortable t-shirts'),
('Jeans', 'Classic denim jeans'),
('Sneakers', 'Athletic and casual shoes'),
('Hoodies', 'Warm and cozy hoodies');

-- Insert sample clothing items
INSERT INTO clothing_items (name, description, price, image_url, brand_id, category_id, user_id, condition, size, color) VALUES
('Classic T-Shirt', 'A comfortable cotton t-shirt', 29.99, 'https://example.com/tshirt.jpg', 1, 1, 1, 'New', 'M', 'Black'),
('Denim Jeans', 'Classic blue denim jeans', 59.99, 'https://example.com/jeans.jpg', 2, 2, 1, 'New', '32', 'Blue'),
('Sneakers', 'Casual athletic sneakers', 79.99, 'https://example.com/sneakers.jpg', 3, 3, 1, 'New', '42', 'White'); 