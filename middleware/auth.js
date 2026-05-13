const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    }
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    
    if (user.status === 0) {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

module.exports = auth;
