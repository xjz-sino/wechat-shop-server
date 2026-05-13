const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// 小程序端接口 - 需要用户登录
router.get('/chat/session', auth, chatController.getOrCreateSession);
router.post('/chat/message', auth, chatController.sendMessage);
router.get('/chat/messages/:sessionId', auth, chatController.getMessages);

module.exports = router;
