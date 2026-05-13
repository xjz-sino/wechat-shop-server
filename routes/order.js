const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/orders/pre', auth, orderController.preOrder);
router.post('/orders', auth, orderController.createOrder);
router.get('/orders', auth, orderController.getOrders);
router.get('/orders/:id', auth, orderController.getOrderDetail);
router.put('/orders/:id/cancel', auth, orderController.cancelOrder);
router.put('/orders/:id/confirm', auth, orderController.confirmReceive);

module.exports = router;
