const { pool } = require('../config/database');
const path = require('path');

// Get all products
async function getAllProducts(req, res) {
    try {
        const { category, brand, size, condition, sort } = req.query;
        let query = `
            SELECT 
                ci.*,
                b.name as brand_name,
                c.name as category_name,
                u.name as user_name,
                CASE WHEN w.item_id IS NOT NULL THEN true ELSE false END as is_in_wishlist
            FROM clothing_items ci
            LEFT JOIN brands b ON ci.brand_id = b.brand_id
            LEFT JOIN categories c ON ci.category_id = c.category_id
            LEFT JOIN users u ON ci.user_id = u.user_id
            LEFT JOIN wishlist w ON ci.item_id = w.item_id AND w.user_id = ?
            WHERE 1=1
        `;
        const params = [req.user ? req.user.user_id : null];

        if (category) {
            query += ' AND ci.category_id = ?';
            params.push(category);
        }
        if (brand) {
            query += ' AND ci.brand_id = ?';
            params.push(brand);
        }
        if (size) {
            query += ' AND ci.size = ?';
            params.push(size);
        }
        if (condition) {
            query += ' AND ci.item_condition = ?';
            params.push(condition);
        }

        // Add sorting
        switch (sort) {
            case 'newest':
                query += ' ORDER BY ci.created_at DESC';
                break;
            case 'oldest':
                query += ' ORDER BY ci.created_at ASC';
                break;
            case 'condition':
                query += ' ORDER BY ci.item_condition ASC';
                break;
            case 'size':
                query += ' ORDER BY ci.size ASC';
                break;
            default:
                query += ' ORDER BY ci.created_at DESC';
        }

        const [items] = await pool.query(query, params);
        const [categories] = await pool.query('SELECT * FROM categories');
        const [brands] = await pool.query('SELECT * FROM brands');

        res.render('products/index', {
            items,
            categories,
            brands,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
}

// Get products by category
async function getProductsByCategory(req, res) {
    try {
        const [products] = await pool.query(`
            SELECT ci.*, u.name as owner_name, c.name as category_name, b.name as brand_name
            FROM clothing_items ci 
            JOIN users u ON ci.user_id = u.user_id 
            JOIN categories c ON ci.category_id = c.category_id
            LEFT JOIN brands b ON ci.brand_id = b.brand_id
            WHERE ci.category_id = ?
        `, [req.params.category]);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}

// Get a single product's details
async function getProductDetails(req, res) {
    try {
        const { id } = req.params;
        const userId = req.session.user?.user_id;

        const query = `
            SELECT 
                ci.*,
                b.name as brand_name,
                c.name as category_name,
                u.name as owner_name,
                CASE WHEN w.item_id IS NOT NULL THEN true ELSE false END as is_in_wishlist
            FROM clothing_items ci
            LEFT JOIN brands b ON ci.brand_id = b.brand_id
            LEFT JOIN categories c ON ci.category_id = c.category_id
            LEFT JOIN users u ON ci.user_id = u.user_id
            LEFT JOIN wishlist w ON ci.item_id = w.item_id AND w.user_id = ?
            WHERE ci.item_id = ?
        `;

        const [product] = await pool.query(query, [userId, id]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Error fetching product details' });
    }
}

// Create a new product
async function createProduct(req, res) {
    try {
        const {
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
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO clothing_items (
                name, description, brand_id, category_id, user_id,
                item_condition, size, color, image_url,
                swap_preferences, preferred_categories, preferred_sizes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description, brand_id, category_id, req.user.user_id,
            item_condition, size, color, image_url,
            swap_preferences, preferred_categories, preferred_sizes
        ]);

        res.json({ success: true, item_id: result.insertId });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Error creating product' });
    }
}

// Update an existing product
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const {
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
        } = req.body;

        // Check if user owns the item
        const [items] = await pool.query(
            'SELECT user_id FROM clothing_items WHERE item_id = ?',
            [id]
        );

        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (items[0].user_id !== req.user.user_id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
        }

        await pool.query(`
            UPDATE clothing_items SET
                name = ?,
                description = ?,
                brand_id = ?,
                category_id = ?,
                item_condition = ?,
                size = ?,
                color = ?,
                image_url = ?,
                swap_preferences = ?,
                preferred_categories = ?,
                preferred_sizes = ?
            WHERE item_id = ?
        `, [
            name, description, brand_id, category_id,
            item_condition, size, color, image_url,
            swap_preferences, preferred_categories, preferred_sizes,
            id
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
}

// Delete a product
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;

        // Check if user owns the item
        const [items] = await pool.query(
            'SELECT user_id FROM clothing_items WHERE item_id = ?',
            [id]
        );

        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (items[0].user_id !== req.user.user_id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
        }

        await pool.query('DELETE FROM clothing_items WHERE item_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
}

// Render add product form
async function renderAddForm(req, res) {
    try {
        const [categories] = await pool.query('SELECT * FROM categories');
        const [brands] = await pool.query('SELECT * FROM brands');
        
        res.render('products/form', {
            categories,
            brands,
            user: req.user
        });
    } catch (error) {
        console.error('Error rendering add form:', error);
        res.status(500).json({ success: false, message: 'Error rendering form' });
    }
}

// Render edit product form
async function renderEditForm(req, res) {
    try {
        const { id } = req.params;
        
        // Check if user owns the item
        const [items] = await pool.query(
            'SELECT * FROM clothing_items WHERE item_id = ?',
            [id]
        );

        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (items[0].user_id !== req.user.user_id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this item' });
        }

        const [categories] = await pool.query('SELECT * FROM categories');
        const [brands] = await pool.query('SELECT * FROM brands');
        
        res.render('products/form', {
            item: items[0],
            categories,
            brands,
            user: req.user
        });
    } catch (error) {
        console.error('Error rendering edit form:', error);
        res.status(500).json({ success: false, message: 'Error rendering form' });
    }
}

const productController = {
    getAllProducts,
    getProductsByCategory,
    getProductDetails,
    createProduct,
    updateProduct,
    deleteProduct,
    renderAddForm,
    renderEditForm
};

module.exports = productController;
