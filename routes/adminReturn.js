const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const adminAuth = require('../middleware/adminAuth');

router.get('/admin/returns', adminAuth, returnController.adminList);
router.put('/admin/return/:id/process', adminAuth, returnController.process);

module.exports = router;
