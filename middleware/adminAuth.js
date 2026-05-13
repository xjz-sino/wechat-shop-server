const { verifyAdminToken } = require('../utils/jwt');
const { Admin } = require('../models');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    
    const decoded = verifyAdminToken(token);
    if (!decoded) {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    }
    
    const admin = await Admin.findByPk(decoded.adminId);
    if (!admin) {
      return res.status(401).json({ code: 401, message: '管理员不存在' });
    }
    
    if (admin.status === 0) {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }
    
    req.adminId = decoded.adminId;
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

module.exports = adminAuth;
