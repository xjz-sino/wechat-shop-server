const { Review, Order, OrderItem, Product, User } = require('../models');
const { Op } = require('sequelize');

const reviewController = {
  async createReview(req, res) {
    try {
      const { orderId, orderItemId, score = 5, content, images } = req.body;

      if (!orderId || !orderItemId) {
        return res.status(400).json({ code: 400, message: '缺少必要参数' });
      }

      const order = await Order.findOne({ where: { id: orderId, user_id: req.userId } });
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 3) {
        return res.status(400).json({ code: 400, message: '订单未完成，无法评价' });
      }

      const orderItem = await OrderItem.findOne({ where: { id: orderItemId, order_id: orderId } });
      if (!orderItem) {
        return res.status(404).json({ code: 404, message: '订单商品不存在' });
      }

      const existingReview = await Review.findOne({ where: { order_item_id: orderItemId } });
      if (existingReview) {
        return res.status(400).json({ code: 400, message: '该商品已评价' });
      }

      const review = await Review.create({
        order_id: orderId,
        order_item_id: orderItemId,
        user_id: req.userId,
        product_id: orderItem.product_id,
        score,
        content,
        images: images ? JSON.stringify(images) : null
      });

      res.json({ code: 0, message: '评价成功', data: review });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, size = 10, score } = req.query;

      const where = { product_id: productId, status: 1 };
      if (score) {
        where.score = parseInt(score);
      }

      const { count, rows } = await Review.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }
        ],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const list = rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        user: r.user ? { nickname: r.user.nickname, avatar: r.user.avatar } : null,
        score: r.score,
        content: r.content,
        images: r.images ? JSON.parse(r.images) : [],
        reply: r.reply,
        replyTime: r.reply_time,
        additionalContent: r.additional_content,
        additionalImages: r.additional_images ? JSON.parse(r.additional_images) : [],
        additionalTime: r.additional_time,
        createdAt: r.created_at
      }));

      const scoreStats = await Review.findAll({
        where: { product_id: productId, status: 1 },
        attributes: [
          'score',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['score']
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          list,
          total: count,
          page: parseInt(page),
          size: parseInt(size),
          scoreStats
        }
      });
    } catch (error) {
      console.error('Get product reviews error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getUserReviews(req, res) {
    try {
      const { page = 1, size = 10 } = req.query;

      const { count, rows } = await Review.findAndCountAll({
        where: { user_id: req.userId },
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'images'] },
          { model: Order, as: 'order', attributes: ['order_no'] }
        ],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const list = rows.map(r => ({
        id: r.id,
        productId: r.product_id,
        product: r.product ? {
          name: r.product.name,
          image: JSON.parse(r.product.images)[0]
        } : null,
        orderNo: r.order ? r.order.order_no : null,
        score: r.score,
        content: r.content,
        images: r.images ? JSON.parse(r.images) : [],
        reply: r.reply,
        replyTime: r.reply_time,
        additionalContent: r.additional_content,
        additionalTime: r.additional_time,
        createdAt: r.created_at
      }));

      res.json({
        code: 0,
        message: 'success',
        data: { list, total: count, page: parseInt(page), size: parseInt(size) }
      });
    } catch (error) {
      console.error('Get user reviews error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async addAdditionalReview(req, res) {
    try {
      const { id } = req.params;
      const { content, images } = req.body;

      const review = await Review.findOne({ where: { id, user_id: req.userId } });
      if (!review) {
        return res.status(404).json({ code: 404, message: '评价不存在' });
      }

      if (review.additional_content) {
        return res.status(400).json({ code: 400, message: '已追评，无法再次追评' });
      }

      await review.update({
        additional_content: content,
        additional_images: images ? JSON.stringify(images) : null,
        additional_time: new Date()
      });

      res.json({ code: 0, message: '追评成功' });
    } catch (error) {
      console.error('Add additional review error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = reviewController;
