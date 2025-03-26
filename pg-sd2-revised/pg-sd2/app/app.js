/*// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.send("Hello world!");
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});*/

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const upload = multer();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'fakepassword',
  database: process.env.DB_NAME || 'sd2-db'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    console.error('Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'sd2-db'
    });
    return;
  }
  console.log('Connected to MySQL database');
});

// Add error handler for database connection
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was closed. Attempting to reconnect...');
    db.connect();
  } else {
    throw err;
  }
});

// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

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
  console.log('Handling request for home page');
  const query = `
    SELECT l.*, u.username, c.name as category_name, GROUP_CONCAT(t.name) as tags
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    LEFT JOIN listing_tags lt ON l.id = lt.listing_id
    LEFT JOIN tags t ON lt.tag_id = t.id
    WHERE l.status = 'available'
    GROUP BY l.id
    ORDER BY l.created_at DESC
    LIMIT 12
  `;
  
  db.query(query, (err, listings) => {
    if (err) {
      console.error('Error fetching listings:', err);
      return res.render('index', { title: 'RRRewear - Home', listings: [] });
    }
    console.log(`Found ${listings.length} listings`);
    res.render('index', { title: 'RRRewear - Home', listings });
  });
});

// Users routes
app.get('/users', (req, res) => {
  const query = 'SELECT id, username, full_name, avatar_url, bio FROM users';
  db.query(query, (err, users) => {
    if (err) {
      req.flash('error_msg', 'Error fetching users');
      return res.redirect('/');
    }
    res.render('users/list', { title: 'Users', users });
  });
});

app.get('/users/:id', (req, res) => {
  const query = `
    SELECT u.*, 
           COUNT(DISTINCT l.id) as total_listings,
           COUNT(DISTINCT s.id) as total_swaps
    FROM users u
    LEFT JOIN listings l ON u.id = l.user_id
    LEFT JOIN swaps s ON u.id = s.requester_id
    WHERE u.id = ?
    GROUP BY u.id
  `;
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }
    res.render('users/profile', { title: 'User Profile', user: results[0] });
  });
});

// Listings routes
app.get('/listings', (req, res) => {
  const query = `
    SELECT l.*, u.username, c.name as category_name, GROUP_CONCAT(t.name) as tags
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    LEFT JOIN listing_tags lt ON l.id = lt.listing_id
    LEFT JOIN tags t ON lt.tag_id = t.id
    WHERE l.status = 'available'
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `;
  
  db.query(query, (err, listings) => {
    if (err) {
      req.flash('error_msg', 'Error fetching listings');
      return res.redirect('/');
    }
    res.render('listings/list', { title: 'Listings', listings });
  });
});

app.get('/listings/:id', (req, res) => {
  const query = `
    SELECT l.*, u.username, u.avatar_url, c.name as category_name, GROUP_CONCAT(t.name) as tags
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    LEFT JOIN listing_tags lt ON l.id = lt.listing_id
    LEFT JOIN tags t ON lt.tag_id = t.id
    WHERE l.id = ?
    GROUP BY l.id
  `;
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      req.flash('error_msg', 'Listing not found');
      return res.redirect('/listings');
    }
    res.render('listings/detail', { title: 'Listing Details', listing: results[0] });
  });
});

// Categories route
app.get('/categories', (req, res) => {
  const query = `
    SELECT c.*, COUNT(l.id) as listing_count
    FROM categories c
    LEFT JOIN listings l ON c.id = l.category_id
    GROUP BY c.id
  `;
  
  db.query(query, (err, categories) => {
    if (err) {
      req.flash('error_msg', 'Error fetching categories');
      return res.redirect('/');
    }
    res.render('categories/list', { title: 'Categories', categories });
  });
});

// Categories routes
app.get('/categories/women', (req, res) => {
  const query = 'SELECT * FROM listings WHERE category = "women" ORDER BY created_at DESC';
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching women\'s products:', err);
      return res.status(500).send('Error loading women\'s products');
    }
    res.render('categories-women', { products });
  });
});

app.get('/categories/men', (req, res) => {
  const query = 'SELECT * FROM listings WHERE category = "men" ORDER BY created_at DESC';
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching men\'s products:', err);
      return res.status(500).send('Error loading men\'s products');
    }
    res.render('categories-men', { products });
  });
});

// Create new listing (protected route)
app.post('/listings/create', isAuthenticated, (req, res) => {
  const { title, description, category_id, condition, size, brand, image_url } = req.body;
  const user_id = req.session.user.id;
  
  const query = `
    INSERT INTO listings (user_id, category_id, title, description, condition, size, brand, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [user_id, category_id, title, description, condition, size, brand, image_url], (err, result) => {
    if (err) {
      req.flash('error_msg', 'Error creating listing');
      return res.redirect('/listings/create');
    }
    req.flash('success_msg', 'Listing created successfully');
    res.redirect(`/listings/${result.insertId}`);
  });
});

// Request swap (protected route)
app.post('/swaps/request', isAuthenticated, (req, res) => {
  const { listing_id } = req.body;
  const requester_id = req.session.user.id;
  
  const query = 'INSERT INTO swaps (listing_id, requester_id) VALUES (?, ?)';
  
  db.query(query, [listing_id, requester_id], (err) => {
    if (err) {
      req.flash('error_msg', 'Error requesting swap');
      return res.redirect(`/listings/${listing_id}`);
    }
    req.flash('success_msg', 'Swap request sent successfully');
    res.redirect(`/listings/${listing_id}`);
  });
});

// Login route
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Login error:', err);
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
      id: user.user_id,
      name: user.name,
      email: user.email,
      location: user.location,
      size: user.size
    };
    
    req.flash('success_msg', 'You are now logged in');
    res.redirect('/profile');
  });
});

// Profile route
app.get('/profile', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  // Get user's products
  const productsQuery = `
    SELECT ci.*, b.name as brand_name, c.name as category_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC
  `;
  
  db.query(productsQuery, [userId], (err, products) => {
    if (err) {
      console.error('Error fetching user products:', err);
      products = [];
    }
    
    res.render('profile', {
      title: 'My Profile',
      user: req.session.user,
      products
    });
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Register route
app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
  const { name, email, password, confirm_password, location, size } = req.body;
  
  // Validate password match
  if (password !== confirm_password) {
    req.flash('error_msg', 'Passwords do not match');
    return res.redirect('/register');
  }
  
  // Check if email already exists
  const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailQuery, [email], async (err, results) => {
    if (err) {
      console.error('Registration error:', err);
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
    const insertQuery = `
      INSERT INTO users (name, email, password, location, size)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [name, email, hashedPassword, location, size], (err, result) => {
      if (err) {
        console.error('Registration error:', err);
        req.flash('error_msg', 'An error occurred during registration');
        return res.redirect('/register');
      }
      
      req.flash('success_msg', 'Registration successful! Please log in');
      res.redirect('/login');
    });
  });
});

// Closet route
app.get('/closet', isAuthenticated, (req, res) => {
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC
  `;
  
  db.query(query, [req.session.user.id], (err, products) => {
    if (err) {
      console.error('Error fetching closet items:', err);
      return res.render('closet', { 
        title: 'My Closet', 
        products: [],
        user: req.session.user 
      });
    }
    console.log('Fetched products:', products);
    res.render('closet', { 
      title: 'My Closet', 
      products,
      user: req.session.user 
    });
  });
});

// Add Product routes
app.get('/products/add', isAuthenticated, (req, res) => {
  res.render('products/add', { 
    title: 'Add Product',
    user: req.session.user 
  });
});

app.post('/products/add', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, brand, category, size, condition, material, color, description } = req.body;
    const userId = req.session.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    const query = `
      INSERT INTO clothing_items (
        user_id, name, brand_id, category_id, size, condition, 
        material, color, description, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    console.log('Adding product with data:', {
      userId,
      name,
      brand,
      category,
      size,
      condition,
      material,
      color,
      description,
      imageUrl
    });

    await db.query(query, [
      userId,
      name,
      brand,
      category,
      size,
      condition,
      material,
      color,
      description,
      imageUrl
    ]);

    res.redirect('/closet');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 