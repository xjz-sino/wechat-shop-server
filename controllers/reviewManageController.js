const { Review } = require('../models');
const { Op } = require('sequelize');

const reviewManageController = {
  async getReviews(req, res) {
    try {
      const { page = 1, size = 10, product_id, status } = req.query;
      const where = {};
      
      if (product_id) {
        where.product_id = product_id;
      }
      if (status !== undefined) {
        where.status = status;
      }

      const { count, rows } = await Review.findAndCountAll({
        where,
        include: [
          { model: require('../models').Product, as: 'product', attributes: ['id', 'name', 'images'] },
          { model: require('../models').User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size)
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: rows,
          total: count,
          page: parseInt(page),
          size: parseInt(size)
        }
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateReviewStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await Review.update({ status }, { where: { id } });

      res.json({ code: 0, message: '更新成功' });
    } catch (error) {
      console.error('Update review status error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      await Review.destroy({ where: { id } });
      res.json({ code: 0, message: '删除成功' });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = reviewManageController;
