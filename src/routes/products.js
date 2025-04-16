const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      condition,
      size,
      brand,
      search
    } = req.query;

    let query = `
      SELECT 
        ci.*,
        b.name as brand_name,
        c.name as category_name,
        u.name as owner_name
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      JOIN users u ON ci.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      query += ' AND ci.category_id = ?';
      params.push(category);
    }

    if (condition) {
      query += ' AND ci.item_condition = ?';
      params.push(condition);
    }

    if (size) {
      query += ' AND ci.size = ?';
      params.push(size);
    }

    if (brand) {
      query += ' AND ci.brand_id = ?';
      params.push(brand);
    }

    if (search) {
      query += ' AND (ci.name LIKE ? OR ci.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY ci.created_at DESC';

    const [products] = await pool.query(query, params);
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    const [brands] = await pool.query('SELECT * FROM brands ORDER BY name');

    let wishlist = [];
    if (req.session.user) {
      const [wishlistItems] = await pool.query(
        'SELECT item_id FROM wishlist WHERE user_id = ?',
        [req.session.user.user_id]
      );
      wishlist = wishlistItems.map(item => item.item_id);
    }

    res.render('products/list', {
      title: 'All Items',
      clothing_items: products.map(product => ({
        ...product,
        is_in_wishlist: wishlist.includes(product.item_id)
      })),
      categories,
      brands,
      selectedFilters: req.query,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).render('error', {
      message: 'Error loading products',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT ci.*, u.name as owner_name, c.name as category_name, b.name as brand_name
      FROM clothing_items ci 
      JOIN users u ON ci.user_id = u.user_id 
      JOIN categories c ON ci.category_id = c.category_id
      LEFT JOIN brands b ON ci.brand_id = b.brand_id
      WHERE ci.category_id = ?
    `, [req.params.categoryId]);

    const [categories] = await pool.query('SELECT * FROM categories');
    const [brands] = await pool.query('SELECT * FROM brands');

    res.render('products/list', {
      products,
      categories,
      brands,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).render('error', { message: 'Error loading products' });
  }
});

// Get product details
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        ci.*,
        b.name as brand_name,
        c.name as category_name,
        u.name as owner_name,
        u.user_id as owner_id
      FROM clothing_items ci
      JOIN brands b ON ci.brand_id = b.brand_id
      JOIN categories c ON ci.category_id = c.category_id
      JOIN users u ON ci.user_id = u.user_id
      WHERE ci.item_id = ?
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).render('error', {
        message: 'Product not found'
      });
    }

    const product = products[0];

    let userItems = [];
    if (req.session.user) {
      const [items] = await pool.query(`
        SELECT item_id, name, image_url
        FROM clothing_items
        WHERE user_id = ? AND item_id != ?
      `, [req.session.user.user_id, product.item_id]);
      userItems = items;
    }

    let inWishlist = false;
    if (req.session.user) {
      const [wishlistItems] = await pool.query(
        'SELECT 1 FROM wishlist WHERE user_id = ? AND item_id = ?',
        [req.session.user.user_id, product.item_id]
      );
      inWishlist = wishlistItems.length > 0;
    }

    res.render('products/detail', {
      title: product.name,
      item: product,
      userItems,
      inWishlist,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).render('error', {
      message: 'Error loading product details',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Render add product form
router.get('/add', auth, async (req, res) => {
  try {
    // Check if brands table exists and has data
    let [brands] = await pool.query('SELECT * FROM brands ORDER BY name');
    
    // If no brands exist, insert default brands
    if (!brands || brands.length === 0) {
      const defaultBrands = [
        'Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo',
        'Levi\'s', 'Gap', 'Puma', 'Under Armour', 'Other'
      ];
      
      for (const brandName of defaultBrands) {
        await pool.query('INSERT INTO brands (name) VALUES (?)', [brandName]);
      }
      
      // Fetch brands again after inserting defaults
      [brands] = await pool.query('SELECT * FROM brands ORDER BY name');
    }
    
    // Fetch categories
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    
    res.render('products/add', {
      title: 'Add New Item',
      categories: categories || [],
      brands: brands || [],
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading add form:', error);
    res.status(500).render('error', {
      message: 'Error loading form',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Create new product
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      description,
      brand_id,
      category_id,
      item_condition,
      size,
      color,
      swap_preferences,
      preferred_categories,
      preferred_sizes
    } = req.body;

    const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

    const [result] = await pool.query(`
      INSERT INTO clothing_items (
        user_id, name, description, brand_id, category_id,
        item_condition, size, color, image_url,
        swap_preferences, preferred_categories, preferred_sizes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.session.user.user_id,
      name,
      description,
      brand_id,
      category_id,
      item_condition,
      size,
      color,
      image_url,
      swap_preferences,
      preferred_categories,
      preferred_sizes
    ]);

    res.redirect('/products');
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).render('error', {
      message: 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Update product
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      description,
      brand_id,
      category_id,
      item_condition,
      size,
      color,
      swap_preferences,
      preferred_categories,
      preferred_sizes
    } = req.body;

    // Check if user owns the product
    const [products] = await pool.query(
      'SELECT * FROM clothing_items WHERE item_id = ? AND user_id = ?',
      [req.params.id, req.session.user.user_id]
    );

    if (products.length === 0) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const image_url = req.file ? `/uploads/products/${req.file.filename}` : products[0].image_url;

    await pool.query(`
      UPDATE clothing_items 
      SET name = ?, description = ?, brand_id = ?, category_id = ?,
          item_condition = ?, size = ?, color = ?, image_url = ?,
          swap_preferences = ?, preferred_categories = ?, preferred_sizes = ?
      WHERE item_id = ?
    `, [
      name,
      description,
      brand_id,
      category_id,
      item_condition,
      size,
      color,
      image_url,
      swap_preferences,
      preferred_categories,
      preferred_sizes,
      req.params.id
    ]);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user owns the product
    const [products] = await pool.query(
      'SELECT * FROM clothing_items WHERE item_id = ? AND user_id = ?',
      [req.params.id, req.session.user.user_id]
    );

    if (products.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await pool.query('DELETE FROM clothing_items WHERE item_id = ?', [req.params.id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router; 