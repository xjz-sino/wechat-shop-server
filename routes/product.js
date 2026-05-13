const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

router.get('/home/config', productController.getHomeConfig);
router.get('/categories', productController.getCategories);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductDetail);
router.get('/pre-sale/list', productController.getPreSaleList);
router.get('/pre-sale/:id', productController.getPreSaleDetail);

module.exports = router;
