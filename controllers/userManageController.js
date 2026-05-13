const { User, Order } = require('../models');
const { Op } = require('sequelize');

const userManageController = {
  async getUsers(req, res) {
    try {
      const { keyword, status, page = 1, size = 10 } = req.query;

      const where = {};
      if (keyword) {
        where[Op.or] = [
          { nickname: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } }
        ];
      }
      if (status !== undefined && status !== '') {
        where.status = parseInt(status);
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const list = await Promise.all(rows.map(async (u) => {
        const orderCounts = await Order.findAll({
          where: { user_id: u.id },
          attributes: [
            'status',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          group: ['status']
        });

        const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
        orderCounts.forEach(o => {
          counts[o.status] = parseInt(o.dataValues.count);
        });

        return {
          id: u.id,
          nickname: u.nickname,
          avatar: u.avatar,
          phone: u.phone,
          status: u.status,
          orderCounts: counts,
          createdAt: u.created_at
        };
      }));

      res.json({
        code: 0,
        message: 'success',
        data: { list, total: count, page: parseInt(page), size: parseInt(size) }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }

      await user.update({ status });

      res.json({ code: 0, message: '状态更新成功' });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }

      const orderStats = await Order.findAll({
        where: { user_id: id },
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
          [require('sequelize').fn('SUM', require('sequelize').col('pay_amount')), 'amount']
        ],
        group: ['status']
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          ...user.toJSON(),
          orderStats
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = userManageController;
