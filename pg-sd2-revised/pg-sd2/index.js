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
const bcrypt = require("bcryptjs");
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
const PORT = process.env.PORT || 3003;

// Set up view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'app/src/views'));

// Database configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'db',
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
      location VARCHAR(255),
      size VARCHAR(10),
      avatar_url VARCHAR(255),
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

  // Create wishlist table
  const createWishlistTable = `
    CREATE TABLE IF NOT EXISTS wishlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      listing_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    )
  `;

  // Create swap_requests table
  const createSwapRequestsTable = `
    CREATE TABLE IF NOT EXISTS swap_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_id INT NOT NULL,
      listing_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
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

  db.query(createWishlistTable, (err) => {
    if (err) {
      console.error('Error creating wishlist table:', err);
    } else {
      console.log('Wishlist table created or already exists');
    }
  });

  db.query(createSwapRequestsTable, (err) => {
    if (err) {
      console.error('Error creating swap_requests table:', err);
    } else {
      console.log('Swap requests table created or already exists');
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

// Initialize database connection
connectWithRetry();

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

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/login');
};

// Routes
app.get('/', (req, res) => {
  const query = `
    SELECT l.*, u.name as seller_name, c.name as category_name
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE l.status = 'available'
    ORDER BY l.created_at DESC
    LIMIT 12
  `;
  
  db.query(query, (err, listings) => {
    if (err) {
      console.error('Error fetching listings:', err);
      return res.render('index', { title: 'RRRewear - Home', listings: [] });
    }
    res.render('index', { title: 'RRRewear - Home', listings });
  });
});

// Auth routes
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      req.flash('error_msg', 'An error occurred during login');
      return res.redirect('/login');
    }
    
    if (results.length === 0) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }
    
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }
    
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      location: user.location,
      size: user.size,
      avatar_url: user.avatar_url
    };
    
    req.flash('success_msg', 'You are now logged in');
    res.redirect('/');
  });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
  const { name, email, password, location, size } = req.body;
  
  // Check if user already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Error checking user existence:', err);
      req.flash('error_msg', 'An error occurred during registration');
      return res.redirect('/register');
    }
    
    if (results.length > 0) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/register');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const query = 'INSERT INTO users (name, email, password, location, size) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, email, hashedPassword, location, size], (err, result) => {
      if (err) {
        console.error('Error creating user:', err);
        req.flash('error_msg', 'An error occurred during registration');
        return res.redirect('/register');
      }
      
      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/login');
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/');
  });
});

// Protected routes
app.get('/profile', isAuthenticated, (req, res) => {
  const query = `
    SELECT l.*, c.name as category_name
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `;
  
  db.query(query, [req.session.user.id], (err, listings) => {
    if (err) {
      console.error('Error fetching user listings:', err);
      return res.render('profile', { title: 'My Profile', user: req.session.user, listings: [] });
    }
    res.render('profile', { title: 'My Profile', user: req.session.user, listings });
  });
});

app.get('/closet', isAuthenticated, (req, res) => {
  const query = `
    SELECT l.*, c.name as category_name
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `;
  
  db.query(query, [req.session.user.id], (err, listings) => {
    if (err) {
      console.error('Error fetching closet items:', err);
      return res.render('closet', { title: 'My Closet', listings: [] });
    }
    res.render('closet', { title: 'My Closet', listings });
  });
});

app.get('/wishlist', isAuthenticated, (req, res) => {
  const query = `
    SELECT l.*, c.name as category_name, u.name as seller_name
    FROM wishlist w
    JOIN listings l ON w.listing_id = l.id
    JOIN categories c ON l.category_id = c.id
    JOIN users u ON l.user_id = u.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `;
  
  db.query(query, [req.session.user.id], (err, listings) => {
    if (err) {
      console.error('Error fetching wishlist:', err);
      return res.render('wishlist', { title: 'My Wishlist', listings: [] });
    }
    res.render('wishlist', { title: 'My Wishlist', listings });
  });
});

app.get('/swap-requests', isAuthenticated, (req, res) => {
  const query = `
    SELECT sr.*, l.title as listing_title, u.name as requester_name
    FROM swap_requests sr
    JOIN listings l ON sr.listing_id = l.id
    JOIN users u ON sr.requester_id = u.id
    WHERE l.user_id = ?
    ORDER BY sr.created_at DESC
  `;
  
  db.query(query, [req.session.user.id], (err, requests) => {
    if (err) {
      console.error('Error fetching swap requests:', err);
      return res.render('swap-requests', { title: 'Swap Requests', requests: [] });
    }
    res.render('swap-requests', { title: 'Swap Requests', requests });
  });
});

// Category routes
app.get('/categories', (req, res) => {
  const query = `
    SELECT c.*, COUNT(l.id) as listing_count
    FROM categories c
    LEFT JOIN listings l ON c.id = l.category_id
    GROUP BY c.id
  `;
  
  db.query(query, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error fetching categories');
      return res.redirect('/');
    }
    res.render('categories/list', { 
      title: 'Categories',
      categories: categories || []
    });
  });
});

app.get('/categories/women', (req, res) => {
  const query = `
    SELECT l.*, u.name as seller_name, c.name as category_name
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE c.name = 'Women' AND l.status = 'available'
    ORDER BY l.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching women\'s products:', err);
      return res.render('categories/categories-women', { 
        title: 'Women\'s Clothing',
        products: [],
        error: 'Error fetching products'
      });
    }
    res.render('categories/categories-women', { 
      title: 'Women\'s Clothing',
      products
    });
  });
});

app.get('/categories/men', (req, res) => {
  const query = `
    SELECT l.*, u.name as seller_name, c.name as category_name
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE c.name = 'Men' AND l.status = 'available'
    ORDER BY l.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching men\'s products:', err);
      return res.render('categories/categories-men', { 
        title: 'Men\'s Clothing',
        products: [],
        error: 'Error fetching products'
      });
    }
    res.render('categories/categories-men', { 
      title: 'Men\'s Clothing',
      products
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404 Not Found',
    message: 'The page you are looking for does not exist.',
    error: {}
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
