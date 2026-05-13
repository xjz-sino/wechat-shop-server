const { User, Address } = require('../models');
const { getWechatOpenId } = require('../utils/wechat');
const { generateToken } = require('../utils/jwt');

// 开发测试模式：使用模拟用户
const DEV_MODE = false;

const userController = {
  async login(req, res) {
    try {
      const { code } = req.body;
      
      let openid;
      
      if (DEV_MODE) {
        // 开发测试模式：生成模拟 openid
        openid = 'test_openid_' + Date.now();
        console.log('开发测试模式登录，模拟 openid:', openid);
      } else {
        // 生产模式：调用微信接口
        if (!code) {
          return res.status(400).json({ code: 400, message: '缺少code参数' });
        }
        const wechatData = await getWechatOpenId(code);
        openid = wechatData.openid;
      }

      let user = await User.findOne({ where: { openid } });
      
      if (!user) {
        user = await User.create({ 
          openid, 
          nickname: '微信用户' + Math.floor(Math.random() * 10000),
          avatar: 'https://picsum.photos/100/100'
        });
      }

      const token = generateToken(user.id);

      res.json({
        code: 0,
        message: 'success',
        data: {
          token,
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ code: 500, message: error.message || '登录失败' });
    }
  },

  async getUserInfo(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: ['id', 'nickname', 'avatar', 'phone', 'status', 'created_at']
      });

      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }

      res.json({ code: 0, message: 'success', data: user });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateUserInfo(req, res) {
    try {
      const { nickname, avatar, phone } = req.body;
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }

      await user.update({ nickname, avatar, phone });

      res.json({ code: 0, message: '更新成功', data: user });
    } catch (error) {
      console.error('Update user info error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getAddresses(req, res) {
    try {
      const addresses = await Address.findAll({
        where: { user_id: req.userId },
        order: [['is_default', 'DESC'], ['created_at', 'DESC']]
      });

      res.json({ code: 0, message: 'success', data: addresses });
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async createAddress(req, res) {
    try {
      const { name, phone, province, city, district, detail, is_default } = req.body;

      if (!name || !phone || !province || !city || !district || !detail) {
        return res.status(400).json({ code: 400, message: '请填写完整的收货信息' });
      }

      if (is_default === 1) {
        await Address.update({ is_default: 0 }, { where: { user_id: req.userId } });
      }

      const address = await Address.create({
        user_id: req.userId,
        name,
        phone,
        province,
        city,
        district,
        detail,
        is_default: is_default || 0
      });

      res.json({ code: 0, message: '添加成功', data: address });
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateAddress(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, province, city, district, detail, is_default } = req.body;

      const address = await Address.findOne({ where: { id, user_id: req.userId } });
      if (!address) {
        return res.status(404).json({ code: 404, message: '地址不存在' });
      }

      if (is_default === 1) {
        await Address.update({ is_default: 0 }, { where: { user_id: req.userId } });
      }

      await address.update({ name, phone, province, city, district, detail, is_default: is_default || 0 });

      res.json({ code: 0, message: '更新成功', data: address });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      const address = await Address.findOne({ where: { id, user_id: req.userId } });

      if (!address) {
        return res.status(404).json({ code: 404, message: '地址不存在' });
      }

      await address.destroy();

      res.json({ code: 0, message: '删除成功' });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async setDefaultAddress(req, res) {
    try {
      const { id } = req.params;

      const address = await Address.findOne({ where: { id, user_id: req.userId } });
      if (!address) {
        return res.status(404).json({ code: 404, message: '地址不存在' });
      }

      await Address.update({ is_default: 0 }, { where: { user_id: req.userId } });
      await address.update({ is_default: 1 });

      res.json({ code: 0, message: '设置成功' });
    } catch (error) {
      console.error('Set default address error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = userController;
