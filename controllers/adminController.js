const bcrypt = require('bcryptjs');
const { Admin } = require('../models');
const { generateAdminToken } = require('../utils/jwt');

const adminController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
      }

      const admin = await Admin.findOne({ where: { username } });

      if (!admin) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      if (admin.status === 0) {
        return res.status(403).json({ code: 403, message: '账号已被禁用' });
      }

      let isPasswordValid = false;
      if (admin.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, admin.password);
      } else {
        isPasswordValid = password === admin.password;
      }
      
      if (!isPasswordValid) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      await admin.update({ last_login_time: new Date() });

      const token = generateAdminToken(admin.id, admin.role);

      res.json({
        code: 0,
        message: '登录成功',
        data: {
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            nickname: admin.nickname,
            avatar: admin.avatar,
            role: admin.role
          }
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getAdminInfo(req, res) {
    try {
      const admin = await Admin.findByPk(req.adminId, {
        attributes: ['id', 'username', 'nickname', 'avatar', 'role', 'last_login_time']
      });

      res.json({ code: 0, message: 'success', data: admin });
    } catch (error) {
      console.error('Get admin info error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = adminController;
