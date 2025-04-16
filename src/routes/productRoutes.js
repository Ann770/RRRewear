const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductDetails);

// Protected routes
router.get('/add', isAuthenticated, productController.renderAddForm);
router.get('/:id/edit', isAuthenticated, productController.renderEditForm);
router.post('/', isAuthenticated, productController.createProduct);
router.put('/:id', isAuthenticated, productController.updateProduct);
router.delete('/:id', isAuthenticated, productController.deleteProduct);

module.exports = router; 