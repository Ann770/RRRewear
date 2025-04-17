const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads/products'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'fakepassword',
  database: process.env.DB_NAME || 'rrrewear'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    console.error('Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'rrrewear'
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

// Import routes
const profileRoutes = require('./routes/profile');
const wishlistRoutes = require('./routes/wishlist');
const swapRequestRoutes = require('./routes/swapRequest');

// Use routes
app.use('/profile', profileRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/swap-requests', swapRequestRoutes);

// Routes
app.get('/', (req, res) => {
  console.log('Handling request for home page');
  const query = `
    SELECT 
      ci.*,
      u.name as user_name,
      c.name as category_name,
      b.name as brand_name
    FROM clothing_items ci
    JOIN users u ON ci.user_id = u.user_id
    JOIN categories c ON ci.category_id = c.category_id
    LEFT JOIN brands b ON ci.brand_id = b.brand_id
    ORDER BY ci.created_at DESC
    LIMIT 12
  `;
  
  db.query(query, (err, items) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.render('index', { title: 'RRRewear - Home', items: [] });
    }
    console.log(`Found ${items.length} items`);
    res.render('index', { title: 'RRRewear - Home', items });
  });
});

// Users routes
app.get('/users', (req, res) => {
  const query = 'SELECT id, name, full_name, avatar_url, bio FROM users';
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
    SELECT l.*, u.name, c.name as category_name, GROUP_CONCAT(t.name) as tags
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
    SELECT l.*, u.name, u.avatar_url, c.name as category_name, GROUP_CONCAT(t.name) as tags
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
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Women'
    ORDER BY ci.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching women\'s products:', err);
      req.flash('error_msg', 'Error loading women\'s products');
      return res.redirect('/');
    }
    res.render('products/list', { 
      title: 'Women\'s Clothing',
      clothing_items: products,
      user: req.session.user
    });
  });
});

app.get('/categories/men', (req, res) => {
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Men'
    ORDER BY ci.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching men\'s products:', err);
      req.flash('error_msg', 'Error loading men\'s products');
      return res.redirect('/');
    }
    res.render('products/list', { 
      title: 'Men\'s Clothing',
      clothing_items: products,
      user: req.session.user
    });
  });
});

app.get('/categories/accessories', (req, res) => {
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Accessories'
    ORDER BY ci.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching accessories:', err);
      req.flash('error_msg', 'Error loading accessories');
      return res.redirect('/');
    }
    res.render('products/list', { 
      title: 'Accessories',
      clothing_items: products,
      user: req.session.user
    });
  });
});

app.get('/categories/shoes', (req, res) => {
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Shoes'
    ORDER BY ci.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching shoes:', err);
      req.flash('error_msg', 'Error loading shoes');
      return res.redirect('/');
    }
    res.render('products/list', { 
      title: 'Shoes',
      clothing_items: products,
      user: req.session.user
    });
  });
});

// Create new listing route
app.get('/listings/create', isAuthenticated, (req, res) => {
  // Get categories for the dropdown
  const categoriesQuery = 'SELECT * FROM categories';
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      categories = [];
    }
    res.render('listings/create', { 
      title: 'Create New Listing',
      categories,
      user: req.session.user 
    });
  });
});

app.post('/listings/create', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    const { name, brand, category, size, condition, material, color, description } = req.body;
    const userId = req.session.user.id;
    
    if (!req.file) {
      req.flash('error_msg', 'Please upload an image');
      return res.redirect('/listings/create');
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    // Get brand ID
    const brandQuery = 'SELECT brand_id FROM brands WHERE name = ?';
    db.query(brandQuery, [brand], (err, brandResults) => {
      if (err) {
        console.error('Error checking brand:', err);
        req.flash('error_msg', 'Error processing brand');
        return res.redirect('/listings/create');
      }

      let brandId;
      if (brandResults.length === 0) {
        // Insert new brand
        const insertBrandQuery = 'INSERT INTO brands (name) VALUES (?)';
        db.query(insertBrandQuery, [brand], (err, result) => {
          if (err) {
            console.error('Error inserting brand:', err);
            req.flash('error_msg', 'Error creating brand');
            return res.redirect('/listings/create');
          }
          brandId = result.insertId;
        });
      } else {
        brandId = brandResults[0].brand_id;
      }

      // Insert listing
      const query = `
        INSERT INTO clothing_items (
          user_id, brand_id, category_id, name, description, 
          size, item_condition, material, color, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(query, [
        userId,
        brandId,
        category,
        name,
        description,
        size,
        condition,
        material,
        color,
        imageUrl
      ], (err, result) => {
        if (err) {
          console.error('Error creating listing:', err);
          req.flash('error_msg', 'Error creating listing');
          return res.redirect('/listings/create');
        }
        
        req.flash('success_msg', 'Listing created successfully');
        res.redirect('/listings');
      });
    });
  } catch (error) {
    console.error('Error:', error);
    req.flash('error_msg', 'Error creating listing');
    res.redirect('/listings/create');
  }
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

// Products route
app.get('/products', (req, res) => {
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    ORDER BY ci.created_at DESC
  `;
  
  db.query(query, (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      req.flash('error_msg', 'Error loading products');
      return res.redirect('/');
    }
    console.log('Fetched products:', products);
    res.render('products/index', { 
      title: 'All Products',
      products,
      user: req.session.user 
    });
  });
});

// Add Product routes
app.get('/products/add', isAuthenticated, (req, res) => {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public/uploads/products');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Fetch brands and categories
  const brandsQuery = 'SELECT * FROM brands ORDER BY name';
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  db.query(brandsQuery, (err, brands) => {
    if (err) {
      console.error('Error fetching brands:', err);
      req.flash('error_msg', 'Error loading brands');
      return res.redirect('/products');
    }
    
    db.query(categoriesQuery, (err, categories) => {
      if (err) {
        console.error('Error fetching categories:', err);
        req.flash('error_msg', 'Error loading categories');
        return res.redirect('/products');
      }
      
  res.render('products/add', { 
    title: 'Add Product',
        user: req.session.user,
        brands: brands || [],
        categories: categories || []
      });
    });
  });
});

app.post('/products/add', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    const { name, brand, category, size, condition, material, color, description } = req.body;
    const userId = req.session.user.id;
    
    if (!req.file) {
      req.flash('error_msg', 'Please upload an image');
      return res.redirect('/products/add');
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    // Get brand ID
    const brandQuery = 'SELECT brand_id FROM brands WHERE name = ?';
    db.query(brandQuery, [brand], (err, brandResults) => {
      if (err) {
        console.error('Error checking brand:', err);
        req.flash('error_msg', 'Error processing brand');
        return res.redirect('/products/add');
      }

      let brandId;
      if (brandResults.length === 0) {
        // Insert new brand
        const insertBrandQuery = 'INSERT INTO brands (name) VALUES (?)';
        db.query(insertBrandQuery, [brand], (err, result) => {
          if (err) {
            console.error('Error inserting brand:', err);
            req.flash('error_msg', 'Error creating brand');
            return res.redirect('/products/add');
          }
          brandId = result.insertId;
          insertClothingItem();
        });
      } else {
        brandId = brandResults[0].brand_id;
        insertClothingItem();
      }

      function insertClothingItem() {
      // Insert clothing item
      const query = `
        INSERT INTO clothing_items (
          user_id, brand_id, category_id, name, description, 
            size, item_condition, material, color, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(query, [
        userId,
        brandId,
        category,
        name,
        description,
        size,
        condition,
        material,
        color,
        imageUrl
      ], (err, result) => {
        if (err) {
          console.error('Error adding product:', err);
          req.flash('error_msg', 'Error adding product');
          return res.redirect('/products/add');
        }
        
        req.flash('success_msg', 'Product added successfully');
          res.redirect('/products');
      });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    req.flash('error_msg', 'Error adding product');
    res.redirect('/products/add');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 