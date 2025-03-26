/*"use strict";

// Include the app.js file.
// This will run the code.
console.log("entrypoint");
const app = require("./app/app.js");*/

const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const fileUpload = require("express-fileupload");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const fs = require("fs");
const multer = require("multer");
const jwt = require("jsonwebtoken");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'app/src/public/uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Database configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sd2-db',
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connect to database with retry logic
function connectWithRetry() {
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      console.error('Connection details:', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'sd2-db'
      });
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
      return;
    }
    console.log('Successfully connected to MySQL database');
    console.log('Database name:', db.config.database);
    createTables();
  });
}

// Function to create tables
function createTables() {
  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create categories table
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create listings table
  const createListingsTable = `
    CREATE TABLE IF NOT EXISTS listings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      condition_status VARCHAR(50) NOT NULL,
      size VARCHAR(50) NOT NULL,
      brand VARCHAR(255),
      image_url VARCHAR(255),
      status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `;

  // Execute table creation queries
  db.query(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created or already exists');
    }
  });

  db.query(createCategoriesTable, (err) => {
    if (err) {
      console.error('Error creating categories table:', err);
    } else {
      console.log('Categories table created or already exists');
      // Insert default categories if they don't exist
      const defaultCategories = ['Women', 'Men', 'Accessories', 'Shoes', 'Bags'];
      defaultCategories.forEach(category => {
        db.query('INSERT IGNORE INTO categories (name) VALUES (?)', [category], (err) => {
          if (err) {
            console.error(`Error inserting category ${category}:`, err);
          }
        });
      });
    }
  });

  db.query(createListingsTable, (err) => {
    if (err) {
      console.error('Error creating listings table:', err);
    } else {
      console.log('Listings table created or already exists');
    }
  });
}

// Add error handler for database connection
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Attempting to reconnect...');
    connectWithRetry();
  } else {
    throw err;
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'app/src/public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use(fileUpload());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/index.html'));
});

// Category routes
app.get('/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/categories.html'));
});

app.get('/categories/women', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/categories-women.html'));
});

app.get('/categories/men', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/categories-men.html'));
});

// User routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/register.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/profile.html'));
});

app.get('/closet', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/src/public/closet.html'));
});

// API routes for dynamic content
app.get('/api/latest-items', (req, res) => {
  const query = `
    SELECT l.*, u.username, c.name as category_name
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE l.status = 'available'
    ORDER BY l.created_at DESC
    LIMIT 6
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching latest items:', err);
      return res.status(500).json({ error: 'Failed to fetch latest items' });
    }
    res.json(results);
    });
});

// Profile API Routes
app.get('/api/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const [user] = await db.query(
            'SELECT id, username, email, bio, location, avatar_url, created_at FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user stats
        const [listings] = await db.query(
            'SELECT COUNT(*) as count FROM listings WHERE user_id = ?',
            [req.session.userId]
        );

        const [purchases] = await db.query(
            'SELECT COUNT(*) as count FROM transactions WHERE buyer_id = ?',
            [req.session.userId]
        );

        const [sales] = await db.query(
            'SELECT COUNT(*) as count FROM transactions WHERE seller_id = ?',
            [req.session.userId]
        );

        res.json({
            ...user,
            listings_count: listings[0].count,
            purchases_count: purchases[0].count,
            sales_count: sales[0].count
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { username, email, bio, location, current_password, new_password } = req.body;

        // Validate current password if trying to change password
        if (new_password) {
            const [user] = await db.query(
                'SELECT password FROM users WHERE id = ?',
                [req.session.userId]
            );

            if (!user || !bcrypt.compareSync(current_password, user.password)) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
        }

        // Update user profile
        const updateFields = [];
        const updateValues = [];

        if (username) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }

        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }

        if (bio !== undefined) {
            updateFields.push('bio = ?');
            updateValues.push(bio);
        }

        if (location !== undefined) {
            updateFields.push('location = ?');
            updateValues.push(location);
        }

        if (new_password) {
            updateFields.push('password = ?');
            updateValues.push(bcrypt.hashSync(new_password, 10));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.session.userId);

        await db.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/profile/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate unique filename
        const filename = `${req.session.userId}-${Date.now()}-${req.file.originalname}`;
        const filepath = path.join(__dirname, 'app/src/public/images/avatars', filename);

        // Ensure avatars directory exists
        await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

        // Move uploaded file
        await fs.promises.rename(req.file.path, filepath);

        // Update user's avatar_url in database
        const avatarUrl = `/images/avatars/${filename}`;
        await db.query(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatarUrl, req.session.userId]
        );

        res.json({ avatar_url: avatarUrl });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Registration endpoint
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
                    process.env.JWT_SECRET || 'your-secret-key',
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

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing required fields:', { email, password: password ? 'provided' : 'missing' });
            return res.status(400).json({ 
                success: false,
                message: 'Please provide email and password' 
            });
        }

        // Find user
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error during login',
                    error: err.message
                });
            }

            if (results.length === 0) {
                console.log('User not found:', email);
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
            }

            const user = results[0];
            console.log('Found user:', JSON.stringify(user, null, 2));

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Invalid password for user:', email);
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
            }

            // Create token
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Log successful login
            console.log('User logged in successfully:', user.id);

            // Set user session
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };

            // Send response
            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar_url: user.avatar_url,
                    points: user.points,
                    level: user.level
                }
            });

            // Try to update last_login after sending response
            if (user.id) {
                db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating last login:', updateErr);
                        // Ignore the error since we've already sent the response
                    }
                });
            } else {
                console.error('User ID is missing. Full user object:', JSON.stringify(user, null, 2));
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// Users List API
app.get('/api/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 12;
        const offset = (page - 1) * perPage;
        const search = req.query.search || '';
        const sort = req.query.sort || 'newest';
        const location = req.query.location || '';

        let query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.avatar_url,
                u.location,
                u.bio,
                u.points,
                u.level,
                u.created_at,
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(DISTINCT l.id) as listings_count,
                COUNT(DISTINCT r.id) as reviews_count
            FROM users u
            LEFT JOIN listings l ON u.id = l.user_id
            LEFT JOIN reviews r ON u.id = r.reviewed_user_id
            WHERE 1=1
        `;

        const params = [];

        if (search) {
            query += ` AND (u.name ILIKE $${params.length + 1} OR u.bio ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        if (location) {
            query += ` AND u.location = $${params.length + 1}`;
            params.push(location);
        }

        query += ` GROUP BY u.id`;

        // Add sorting
        switch (sort) {
            case 'active':
                query += ` ORDER BY listings_count DESC, rating DESC`;
                break;
            case 'rating':
                query += ` ORDER BY rating DESC, listings_count DESC`;
                break;
            default: // newest
                query += ` ORDER BY u.created_at DESC`;
        }

        // Add pagination
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(perPage, offset);

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT u.id)
            FROM users u
            WHERE 1=1
            ${search ? `AND (u.name ILIKE $1 OR u.bio ILIKE $1)` : ''}
            ${location ? `AND u.location = $${search ? 2 : 1}` : ''}
        `;
        const countParams = [];
        if (search) countParams.push(`%${search}%`);
        if (location) countParams.push(location);

        const [users, totalCount] = await Promise.all([
            db.query(query, params),
            db.query(countQuery, countParams)
        ]);

        // Get unique locations for filter
        const locationsQuery = `
            SELECT DISTINCT location
            FROM users
            WHERE location IS NOT NULL AND location != ''
            ORDER BY location
        `;
        const locations = await db.query(locationsQuery);

        // Get user badges
        const badgesQuery = `
            SELECT ub.user_id, b.name, b.icon
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ANY($1)
        `;
        const userIds = users.rows.map(user => user.id);
        const badges = await db.query(badgesQuery, [userIds]);

        // Attach badges to users
        const usersWithBadges = users.rows.map(user => ({
            ...user,
            badges: badges.rows.filter(badge => badge.user_id === user.id)
        }));

        res.json({
            success: true,
            users: usersWithBadges,
            total: parseInt(totalCount.rows[0].count),
            page,
            per_page: perPage,
            locations: locations.rows.map(row => row.location)
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", {
        title: "Error - RRRewear",
        message: "Something went wrong!",
        user: req.session.user,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'app/src/public/404.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
