USE rrrewear;

-- Create clothing_items table if it doesn't exist
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

-- Create wishlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, item_id)
);

-- Insert sample clothing items
INSERT INTO clothing_items (name, description, price, image_url, brand_id, category_id, user_id, condition, size, color) VALUES
('Classic T-Shirt', 'A comfortable cotton t-shirt', 29.99, 'https://example.com/tshirt.jpg', 1, 1, 1, 'New', 'M', 'Black'),
('Denim Jeans', 'Classic blue denim jeans', 59.99, 'https://example.com/jeans.jpg', 2, 2, 1, 'New', '32', 'Blue'),
('Sneakers', 'Casual athletic sneakers', 79.99, 'https://example.com/sneakers.jpg', 3, 3, 1, 'New', '42', 'White'); 