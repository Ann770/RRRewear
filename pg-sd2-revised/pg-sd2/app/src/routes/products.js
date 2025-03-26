const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductDetails);

// Protected routes (require authentication)
router.post('/', auth, upload.single('image'), productController.createProduct);
router.put('/:id', auth, upload.single('image'), productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

// Product search and filtering
router.get('/search', productController.searchProducts);
router.get('/filter', productController.filterProducts);

// User's products
router.get('/user/:userId', productController.getUserProducts);

module.exports = router; 