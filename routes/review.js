const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/reviews', auth, reviewController.createReview);
router.get('/reviews/product/:productId', reviewController.getProductReviews);
router.get('/reviews/user', auth, reviewController.getUserReviews);
router.put('/reviews/:id/additional', auth, reviewController.addAdditionalReview);

module.exports = router;
