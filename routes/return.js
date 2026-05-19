const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const auth = require('../middleware/auth');

router.post('/return', auth, returnController.create);
router.get('/returns', auth, returnController.list);
router.get('/return/:id', auth, returnController.detail);

module.exports = router;
