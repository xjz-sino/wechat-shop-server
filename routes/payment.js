const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/payment/wx/prepay', auth, paymentController.prepay);
router.post('/payment/wx/notify', paymentController.wxNotify);

module.exports = router;
