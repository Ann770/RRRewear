const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'sd2-db',
    port: 3306
});

// Connect to database with detailed error logging
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.error('Connection details:', {
            host: 'localhost',
            user: 'root',
            database: 'sd2-db',
            port: 3306
        });
        return;
    }
    console.log('Successfully connected to MySQL database');
    console.log('Database name:', db.config.database);
    createTables();
});

// Add error handler for database connection
db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed. Attempting to reconnect...');
        db.connect();
    } else {
        throw err;
    }
});

// Function to create tables
function createTables() {
    // Create users table
    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table ready');
        }
    });

    // Create categories table
    db.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating categories table:', err);
        } else {
            console.log('Categories table ready');
            // Insert default categories
            db.query(`
                INSERT IGNORE INTO categories (name) VALUES 
                ('Women'),
                ('Men'),
                ('Accessories'),
                ('Shoes'),
                ('Bags')
            `);
        }
    });

    // Create listings table
    db.query(`
        CREATE TABLE IF NOT EXISTS listings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            category_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            condition_status VARCHAR(50) NOT NULL,
            size VARCHAR(10),
            brand VARCHAR(100),
            image_url VARCHAR(255),
            status ENUM('available', 'pending', 'swapped') DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating listings table:', err);
        } else {
            console.log('Listings table ready');
        }
    });
}

// Authentication endpoints
app.post('/api/register', async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            console.log('Missing required fields:', { name, email, password: password ? 'provided' : 'missing' });
            return res.status(400).json({ 
                success: false,
                message: 'Please provide all required fields' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Please provide a valid email address' 
            });
        }

        // Check if user already exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error checking user:', err);
                console.error('SQL Query:', 'SELECT * FROM users WHERE email = ?');
                console.error('Parameters:', [email]);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error checking user existence',
                    error: err.message
                });
            }

            if (results.length > 0) {
                console.log('User already exists:', email);
                return res.status(400).json({ 
                    success: false,
                    message: 'User already exists' 
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');

            // Insert new user
            const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
            db.query(query, [name, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error creating user:', err);
                    console.error('SQL Query:', query);
                    console.error('Parameters:', [name, email, 'hashed_password']);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error creating user',
                        error: err.message
                    });
                }

                console.log('User created successfully:', result.insertId);

                // Create token
                const token = jwt.sign(
                    { userId: result.insertId },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    token,
                    user: {
                        id: result.insertId,
                        name,
                        email
                    }
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ 
                success: false,
                message: 'Please provide email and password' 
            });
        }

        // Find user
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error finding user:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error finding user',
                    error: err.message
                });
            }

            if (results.length === 0) {
                console.log('User not found:', email);
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
            }

            const user = results[0];
            console.log('User found:', user.id);

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                console.log('Invalid password for user:', email);
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
            }

            console.log('Password validated successfully');

            // Create token
            const token = jwt.sign(
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Logged in successfully',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// Get user profile data
app.get('/api/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Get user data
        db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching user profile:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error fetching user profile' 
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User not found' 
                });
            }

            const user = results[0];

            // Get user's listings count
            db.query('SELECT COUNT(*) as count FROM listings WHERE user_id = ?', [userId], (err, listingResults) => {
                if (err) {
                    console.error('Error fetching listings count:', err);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error fetching user stats' 
                    });
                }

                // Get user's swaps count
                db.query('SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status = "swapped"', [userId], (err, swapResults) => {
                    if (err) {
                        console.error('Error fetching swaps count:', err);
                        return res.status(500).json({ 
                            success: false,
                            message: 'Error fetching user stats' 
                        });
                    }

                    res.json({
                        success: true,
                        user: {
                            ...user,
                            listingsCount: listingResults[0].count,
                            swapsCount: swapResults[0].count
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Invalid token' 
        });
    }
});

// Category routes
app.get('/categories/women', (req, res) => {
    const query = `
        SELECT l.*, u.name as username, c.name as category_name
        FROM listings l
        JOIN users u ON l.user_id = u.id
        JOIN categories c ON l.category_id = c.id
        WHERE c.name = 'Women' AND l.status = 'available'
        ORDER BY l.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching women\'s items:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        res.sendFile(path.join(__dirname, 'public', 'categories-women.html'));
    });
});

app.get('/categories/men', (req, res) => {
    const query = `
        SELECT l.*, u.name as username, c.name as category_name
        FROM listings l
        JOIN users u ON l.user_id = u.id
        JOIN categories c ON l.category_id = c.id
        WHERE c.name = 'Men' AND l.status = 'available'
        ORDER BY l.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching men\'s items:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        res.sendFile(path.join(__dirname, 'public', 'categories-men.html'));
    });
});

// API routes for dynamic content
app.get('/api/category/:category', (req, res) => {
    const { category } = req.params;
    const { search, size, condition } = req.query;
    
    let query = `
        SELECT l.*, u.name as username, c.name as category_name
        FROM listings l
        JOIN users u ON l.user_id = u.id
        JOIN categories c ON l.category_id = c.id
        WHERE c.name = ? AND l.status = 'available'
    `;
    
    const params = [category];
    
    if (search) {
        query += ` AND (l.title LIKE ? OR l.description LIKE ? OR l.brand LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (size) {
        query += ` AND l.size = ?`;
        params.push(size);
    }
    
    if (condition) {
        query += ` AND l.condition_status = ?`;
        params.push(condition);
    }
    
    query += ` ORDER BY l.created_at DESC`;
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching items:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        res.json(results);
    });
});

// Search endpoint
app.get('/api/search', (req, res) => {
    const { query, category, size, condition } = req.query;
    
    let sqlQuery = `
        SELECT l.*, u.name as username, c.name as category_name
        FROM listings l
        JOIN users u ON l.user_id = u.id
        JOIN categories c ON l.category_id = c.id
        WHERE l.status = 'available'
    `;
    
    const params = [];
    
    if (query) {
        sqlQuery += ` AND (l.title LIKE ? OR l.description LIKE ? OR l.brand LIKE ?)`;
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category) {
        sqlQuery += ` AND c.name = ?`;
        params.push(category);
    }
    
    if (size) {
        sqlQuery += ` AND l.size = ?`;
        params.push(size);
    }
    
    if (condition) {
        sqlQuery += ` AND l.condition_status = ?`;
        params.push(condition);
    }
    
    sqlQuery += ` ORDER BY l.created_at DESC`;
    
    db.query(sqlQuery, params, (err, results) => {
        if (err) {
            console.error('Error searching items:', err);
            return res.status(500).json({ error: 'Failed to search items' });
        }
        res.json(results);
    });
});

// Serve HTML files
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

// Get recent listings
app.get('/api/listings/recent', (req, res) => {
    const query = `
        SELECT l.*, u.name as username, c.name as category_name
        FROM listings l
        JOIN users u ON l.user_id = u.id
        JOIN categories c ON l.category_id = c.id
        WHERE l.status = 'available'
        ORDER BY l.created_at DESC
        LIMIT 6
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching recent listings:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error fetching recent listings',
                error: err.message
            });
        }
        
        // Format the results
        const formattedListings = results.map(listing => ({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            image_url: listing.image_url || '/images/placeholder.svg',
            condition_status: listing.condition_status,
            size: listing.size,
            brand: listing.brand,
            category: listing.category_name,
            username: listing.username,
            created_at: listing.created_at
        }));
        
        res.json({
            success: true,
            listings: formattedListings
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 