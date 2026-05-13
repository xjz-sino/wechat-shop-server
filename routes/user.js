const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userStatsController = require('../controllers/userStatsController');
const auth = require('../middleware/auth');

router.post('/user/login', userController.login);
router.get('/user/info', auth, userController.getUserInfo);
router.put('/user/info', auth, userController.updateUserInfo);
router.get('/user/address', auth, userController.getAddresses);
router.post('/user/address', auth, userController.createAddress);
router.put('/user/address/:id', auth, userController.updateAddress);
router.delete('/user/address/:id', auth, userController.deleteAddress);
router.put('/user/address/default/:id', auth, userController.setDefaultAddress);

// 用户统计接口（需要管理员权限）
router.get('/user/stats', auth, userStatsController.getUserStats);
router.get('/users/with-stats', auth, userStatsController.getUsersWithStats);

module.exports = router;
