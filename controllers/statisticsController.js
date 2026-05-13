const { Order, OrderItem, Product, User, Review, sequelize } = require('../models');
const { Op } = require('sequelize');

const statisticsController = {
  async getSalesStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const where = { status: { [Op.gte]: 1 } };
      if (startDate && endDate) {
        where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const salesData = await Order.findAll({
        where,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('pay_amount')), 'salesAmount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });

      const totalData = await Order.findOne({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
          [sequelize.fn('SUM', sequelize.col('pay_amount')), 'totalAmount']
        ]
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          trend: salesData.map(s => ({
            date: s.dataValues.date,
            orderCount: parseInt(s.dataValues.orderCount),
            salesAmount: parseFloat(s.dataValues.salesAmount || 0)
          })),
          summary: {
            totalOrders: parseInt(totalData.dataValues.totalOrders || 0),
            totalAmount: parseFloat(totalData.dataValues.totalAmount || 0)
          }
        }
      });
    } catch (error) {
      console.error('Get sales statistics error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getProductStatistics(req, res) {
    try {
      const { type = 'sales' } = req.query;

      // 简化查询，直接从 Product 表获取销量数据
      const products = await Product.findAll({
        where: { status: 1 },
        attributes: ['id', 'name', 'images', 'price', 'sales'],
        order: type === 'amount' ? [['price', 'DESC']] : [['sales', 'DESC']],
        limit: 10
      });

      const list = products.map(p => ({
        id: p.id,
        name: p.name,
        image: p.images ? JSON.parse(p.images)[0] : '',
        sales: p.sales,
        amount: parseFloat(p.price) * p.sales
      }));

      res.json({
        code: 0,
        message: 'success',
        data: { list }
      });
    } catch (error) {
      console.error('Get product statistics error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getUserStatistics(req, res) {
    try {
      const totalUsers = await User.count();
      const newUsersToday = await User.count({
        where: {
          created_at: { [Op.gte]: sequelize.fn('CURDATE') }
        }
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          totalUsers,
          newUsersToday
        }
      });
    } catch (error) {
      console.error('Get user statistics error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getDashboardData(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalSales, todaySales, totalOrders, todayOrders, totalUsers, totalProducts, pendingOrders, pendingReviews] = await Promise.all([
        Order.sum('pay_amount', { where: { status: { [Op.gte]: 1 } } }),
        Order.sum('pay_amount', { where: { status: { [Op.gte]: 1 }, created_at: { [Op.gte]: today } } }),
        Order.count({ where: { status: { [Op.gte]: 1 } } }),
        Order.count({ where: { status: { [Op.gte]: 1 }, created_at: { [Op.gte]: today } } }),
        User.count(),
        Product.count(),
        Order.count({ where: { status: 1 } }),
        Review.count({ where: { status: 0 } })
      ]);

      res.json({
        code: 0,
        message: 'success',
        data: {
          totalSales: parseFloat(totalSales || 0),
          todaySales: parseFloat(todaySales || 0),
          totalOrders: totalOrders || 0,
          todayOrders: todayOrders || 0,
          totalUsers: totalUsers || 0,
          totalProducts: totalProducts || 0,
          pendingOrders: pendingOrders || 0,
          pendingReviews: pendingReviews || 0
        }
      });
    } catch (error) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = statisticsController;
