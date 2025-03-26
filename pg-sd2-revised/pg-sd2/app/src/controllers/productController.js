const { pool } = require('../config/database');
const path = require('path');

// Get all products
async function getAllProducts(req, res) {
    try {
        const [products] = await pool.query(`
            SELECT p.*, u.username as owner_name, c.name as category_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id 
            JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'available'
        `);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}

// Get products by category
async function getProductsByCategory(req, res) {
    try {
        const [products] = await pool.query(`
            SELECT p.*, u.username as owner_name, c.name as category_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id 
            JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.status = 'available'
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
        const [products] = await pool.query(`
            SELECT p.*, u.username as owner_name, c.name as category_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id 
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(products[0]);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
}

// Create a new product
async function createProduct(req, res) {
    try {
        const {
            category_id,
            name,
            brand,
            size,
            condition,
            material,
            color,
            description
        } = req.body;

        if (!req.files || !req.files.image) {
            return res.status(400).json({ message: 'Product image is required' });
        }

        const image = req.files.image;
        const uploadPath = path.join(process.env.UPLOAD_PATH, `${Date.now()}-${image.name}`);
        await image.mv(uploadPath);

        const [result] = await pool.query(`
            INSERT INTO products (
                user_id, category_id, name, brand, size, condition, 
                material, color, description, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.session.userId,
            category_id,
            name,
            brand,
            size,
            condition,
            material,
            color,
            description,
            uploadPath.replace('public', '')
        ]);

        res.status(201).json({ 
            message: 'Product added successfully',
            productId: result.insertId
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding product' });
    }
}

// Update an existing product
async function updateProduct(req, res) {
    try {
        const { category_id, name, brand, size, condition, material, color, description } = req.body;
        
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );

        if (products.length === 0) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        await pool.query(`
            UPDATE products 
            SET category_id = ?, name = ?, brand = ?, size = ?, condition = ?, material = ?, color = ?, description = ?
            WHERE id = ?
        `, [category_id, name, brand, size, condition, material, color, description, req.params.id]);

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
}

// Delete a product
async function deleteProduct(req, res) {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );

        if (products.length === 0) {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
}

module.exports = {
    getAllProducts,
    getProductsByCategory,
    getProductDetails,
    createProduct,
    updateProduct,
    deleteProduct
};
