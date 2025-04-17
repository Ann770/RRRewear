const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const fileUpload = require("express-fileupload");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const db = require("./config/database");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp/',
        createParentPath: true,
    })
);
app.use(
    session({
        secret: "rrrewear_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// View engine setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views")); // Adjusted to point to 'views' folder in the current directory

// Static files
app.use(express.static(path.join(__dirname, "public"))); // Adjusted to use the 'public' directory inside the current folder

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/products", require("./routes/products"));
app.use("/users", require("./routes/users"));
app.use("/swaps", require("./routes/swaps"));
app.use("/messages", require("./routes/messages"));
app.use("/payments", require("./routes/payments"));
app.use("/reviews", require("./routes/reviews"));

// Home route - Show all products
app.get('/', (req, res) => {
  const query = `
    SELECT 
      ci.*, 
      b.name as brand_name, 
      c.name as category_name, 
      u.name as owner_name,
      u.email as owner_email
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE ci.is_available = 1
    ORDER BY ci.created_at DESC
  `;
  
  // Get all categories
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  // Get all brands
  const brandsQuery = 'SELECT * FROM brands ORDER BY name';
  
  // First get categories
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error loading categories');
      return res.redirect('/');
    }
    
    // Then get brands
    db.query(brandsQuery, (err, brands) => {
      if (err) {
        console.error('Error fetching brands:', err);
        req.flash('error_msg', 'Error loading brands');
        return res.redirect('/');
      }
      
      // Finally get products
      db.query(query, (err, products) => {
        if (err) {
          console.error('Error fetching products:', err);
          req.flash('error_msg', 'Error loading products');
          return res.redirect('/');
        }
        
        res.render('products/list', { 
          title: 'All Products',
          clothing_items: products || [],
          categories: categories || [],
          brands: brands || [],
          selectedFilters: {},
          user: req.session.user
        });
      });
    });
  });
});

// Products route - Show all products
app.get('/products', (req, res) => {
  const query = `
    SELECT ci.*, b.name as brand_name, c.name as category_name, u.name as owner_name
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    ORDER BY ci.created_at DESC
  `;
  
  // First get all categories
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error loading categories');
      return res.redirect('/');
    }
    
    // Then get all products
    db.query(query, (err, products) => {
      if (err) {
        console.error('Error fetching products:', err);
        req.flash('error_msg', 'Error loading products');
        return res.redirect('/');
      }
      res.render('products/list', { 
        title: 'All Products',
        clothing_items: products || [],
        categories: categories || [],
        brands: [], // Add empty brands array
        selectedFilters: {},
        user: req.session.user
      });
    });
  });
});

// Categories routes
app.get('/categories/women', (req, res) => {
  const query = `
    SELECT 
      ci.*, 
      b.name as brand_name, 
      c.name as category_name, 
      u.name as owner_name,
      u.email as owner_email
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Women' AND ci.is_available = 1
    ORDER BY ci.created_at DESC
  `;
  
  // Get all categories
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  // Get all brands
  const brandsQuery = 'SELECT * FROM brands ORDER BY name';
  
  // First get categories
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error loading categories');
      return res.redirect('/');
    }
    
    // Then get brands
    db.query(brandsQuery, (err, brands) => {
      if (err) {
        console.error('Error fetching brands:', err);
        req.flash('error_msg', 'Error loading brands');
        return res.redirect('/');
      }
      
      // Finally get products
      db.query(query, (err, products) => {
        if (err) {
          console.error('Error fetching products:', err);
          req.flash('error_msg', 'Error loading women\'s products');
          return res.redirect('/');
        }
        
        res.render('products/list', { 
          title: 'Women\'s Clothing',
          clothing_items: products || [],
          categories: categories || [],
          brands: brands || [],
          selectedFilters: { category: 6 }, // Women category ID
          user: req.session.user
        });
      });
    });
  });
});

app.get('/categories/men', (req, res) => {
  const query = `
    SELECT 
      ci.*, 
      b.name as brand_name, 
      c.name as category_name, 
      u.name as owner_name,
      u.email as owner_email
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Men' AND ci.is_available = 1
    ORDER BY ci.created_at DESC
  `;
  
  // Get all categories
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  // Get all brands
  const brandsQuery = 'SELECT * FROM brands ORDER BY name';
  
  // First get categories
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error loading categories');
      return res.redirect('/');
    }
    
    // Then get brands
    db.query(brandsQuery, (err, brands) => {
      if (err) {
        console.error('Error fetching brands:', err);
        req.flash('error_msg', 'Error loading brands');
        return res.redirect('/');
      }
      
      // Finally get products
      db.query(query, (err, products) => {
        if (err) {
          console.error('Error fetching products:', err);
          req.flash('error_msg', 'Error loading men\'s products');
          return res.redirect('/');
        }
        
        res.render('products/list', { 
          title: 'Men\'s Clothing',
          clothing_items: products || [],
          categories: categories || [],
          brands: brands || [],
          selectedFilters: { category: 5 }, // Men category ID
          user: req.session.user
        });
      });
    });
    });
});

app.get('/categories/accessories', (req, res) => {
  const query = `
    SELECT 
      ci.*, 
      b.name as brand_name, 
      c.name as category_name, 
      u.name as owner_name,
      u.email as owner_email
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Accessories' AND ci.is_available = 1
    ORDER BY ci.created_at DESC
  `;
  
  // Get all categories
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  // Get all brands
  const brandsQuery = 'SELECT * FROM brands ORDER BY name';
  
  // First get categories
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error loading categories');
      return res.redirect('/');
    }
    
    // Then get brands
    db.query(brandsQuery, (err, brands) => {
      if (err) {
        console.error('Error fetching brands:', err);
        req.flash('error_msg', 'Error loading brands');
        return res.redirect('/');
      }
      
      // Finally get products
      db.query(query, (err, products) => {
        if (err) {
          console.error('Error fetching products:', err);
          req.flash('error_msg', 'Error loading accessories');
          return res.redirect('/');
        }
        
        res.render('products/list', { 
          title: 'Accessories',
          clothing_items: products || [],
          categories: categories || [],
          brands: brands || [],
          selectedFilters: { category: 7 }, // Accessories category ID
          user: req.session.user
        });
      });
    });
    });
});

app.get('/categories/shoes', (req, res) => {
  const query = `
    SELECT 
      ci.*, 
      b.name as brand_name, 
      c.name as category_name, 
      u.name as owner_name,
      u.email as owner_email
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.brand_id
    JOIN categories c ON ci.category_id = c.category_id
    JOIN users u ON ci.user_id = u.user_id
    WHERE c.name = 'Shoes' AND ci.is_available = 1
    ORDER BY ci.created_at DESC
  `;
  
  // Get all categories
  const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
  
  // Get all brands
  const brandsQuery = 'SELECT * FROM brands ORDER BY name';
  
  // First get categories
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching categories:', err);
      req.flash('error_msg', 'Error loading categories');
      return res.redirect('/');
    }
    
    // Then get brands
    db.query(brandsQuery, (err, brands) => {
      if (err) {
        console.error('Error fetching brands:', err);
        req.flash('error_msg', 'Error loading brands');
        return res.redirect('/');
      }
      
      // Finally get products
      db.query(query, (err, products) => {
        if (err) {
          console.error('Error fetching products:', err);
          req.flash('error_msg', 'Error loading shoes');
          return res.redirect('/');
        }
        
        res.render('products/list', { 
          title: 'Shoes',
          clothing_items: products || [],
          categories: categories || [],
          brands: brands || [],
          selectedFilters: { category: 8 }, // Shoes category ID
          user: req.session.user
        });
      });
    });
    });
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
    res.status(404).render("404", {
        title: "404 Not Found - RRRewear",
        user: req.session.user,
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
