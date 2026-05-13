const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

router.get('/cart', auth, cartController.getCart);
router.post('/cart', auth, cartController.addCart);
router.put('/cart/:id', auth, cartController.updateCart);
router.delete('/cart/:id', auth, cartController.deleteCart);
router.delete('/cart/clear', auth, cartController.clearCart);

module.exports = router;
