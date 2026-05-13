const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productManageController = require('../controllers/productManageController');
const orderManageController = require('../controllers/orderManageController');
const userManageController = require('../controllers/userManageController');
const userStatsController = require('../controllers/userStatsController');
const chatController = require('../controllers/chatController');
const statisticsController = require('../controllers/statisticsController');
const reviewManageController = require('../controllers/reviewManageController');
const homeConfigController = require('../controllers/homeConfigController');
const imageManageController = require('../controllers/imageManageController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');
const config = require('../config');

router.post('/login', adminController.login);
router.get('/info', adminAuth, adminController.getAdminInfo);

router.get('/products', adminAuth, productManageController.getProducts);
router.get('/products/:id', adminAuth, productManageController.getProduct);
router.post('/products', adminAuth, productManageController.createProduct);
router.put('/products/:id', adminAuth, productManageController.updateProduct);
router.put('/products/:id/status', adminAuth, productManageController.updateProductStatus);
router.delete('/products/:id', adminAuth, productManageController.deleteProduct);
router.get('/categories/all', adminAuth, productManageController.getCategories);
router.post('/categories', adminAuth, productManageController.createCategory);
router.put('/categories/:id', adminAuth, productManageController.updateCategory);
router.delete('/categories/:id', adminAuth, productManageController.deleteCategory);

router.get('/orders', adminAuth, orderManageController.getOrders);
router.get('/orders/:id', adminAuth, orderManageController.getOrder);
router.put('/orders/:id', adminAuth, orderManageController.updateOrder);
router.delete('/orders/:id', adminAuth, orderManageController.deleteOrder);
router.put('/orders/:id/ship', adminAuth, orderManageController.shipOrder);
router.put('/orders/:id/refund', adminAuth, orderManageController.refundOrder);

router.get('/users', adminAuth, userManageController.getUsers);
router.get('/users/:id', adminAuth, userManageController.getUser);
router.put('/users/:id/status', adminAuth, userManageController.updateUserStatus);

// 用户数据监控
router.get('/user/stats', adminAuth, userStatsController.getUserStats);
router.get('/users/with-stats', adminAuth, userStatsController.getUsersWithStats);

// 客服消息
router.get('/chat/sessions', adminAuth, chatController.getAllSessions);
router.get('/chat/sessions/:sessionId', adminAuth, chatController.getSessionMessages);
router.post('/chat/reply', adminAuth, chatController.replyMessage);
router.put('/chat/sessions/:sessionId/close', adminAuth, chatController.closeSession);
router.get('/chat/unread-count', adminAuth, chatController.getUnreadCount);

router.get('/statistics/sales', adminAuth, statisticsController.getSalesStatistics);
router.get('/statistics/products', adminAuth, statisticsController.getProductStatistics);
router.get('/statistics/users', adminAuth, statisticsController.getUserStatistics);

router.get('/reviews', adminAuth, reviewManageController.getReviews);
router.put('/reviews/:id/status', adminAuth, reviewManageController.updateReviewStatus);
router.delete('/reviews/:id', adminAuth, reviewManageController.deleteReview);

router.get('/home/configs', adminAuth, homeConfigController.getConfigs);
router.post('/home/configs', adminAuth, homeConfigController.createConfig);
router.put('/home/configs/:id', adminAuth, homeConfigController.updateConfig);
router.delete('/home/configs/:id', adminAuth, homeConfigController.deleteConfig);

// 图片上传
router.post('/upload', adminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '没有上传文件' });
    }
    const fileUrl = `${config.upload.urlPrefix}/${req.file.filename}`;
    res.json({
      code: 0,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ code: 500, message: '上传失败' });
  }
});

// 图片空间管理
router.get('/images', adminAuth, imageManageController.getImages);
router.get('/images/categories', adminAuth, imageManageController.getCategories);
router.get('/images/stats', adminAuth, imageManageController.getImageStats);
router.delete('/images/:filename', adminAuth, imageManageController.deleteImage);
router.post('/images/batch-delete', adminAuth, imageManageController.batchDeleteImages);

module.exports = router;
