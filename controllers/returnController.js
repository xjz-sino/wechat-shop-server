const { Return, Order, User, OrderItem, Product } = require('../models');
const { Op } = require('sequelize');

const returnController = {
  async create(req, res) {
    try {
      const { orderId, reason, description, images } = req.body;
      const userId = req.userId;

      const order = await Order.findOne({
        where: { id: orderId, user_id: userId }
      });

      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 2 && order.status !== 3) {
        return res.status(400).json({ code: 400, message: '只有已发货或已完成的订单可以申请退货' });
      }

      const existingReturn = await Return.findOne({
        where: { order_id: orderId, user_id: userId }
      });

      if (existingReturn) {
        return res.status(400).json({ code: 400, message: '该订单已提交过退货申请' });
      }

      const returnOrder = await Return.create({
        order_id: orderId,
        user_id: userId,
        reason,
        description,
        images: images ? JSON.stringify(images) : null,
        status: 0
      });

      res.json({ code: 0, message: '退货申请已提交', data: returnOrder });
    } catch (error) {
      console.error('Create return error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async list(req, res) {
    try {
      const userId = req.userId;
      const { page = 1, size = 10 } = req.query;

      const { rows, count } = await Return.findAndCountAll({
        where: { user_id: userId },
        include: [{
          model: Order,
          as: 'order',
          include: [{
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }]
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size)
      });

      const formattedRows = rows.map(r => ({
        id: r.id,
        orderId: r.order_id,
        reason: r.reason,
        description: r.description,
        images: r.images ? JSON.parse(r.images) : [],
        status: r.status,
        adminRemark: r.admin_remark,
        createdAt: r.created_at,
        order: r.order ? {
          id: r.order.id,
          orderNo: r.order.order_no,
          totalAmount: parseFloat(r.order.total_amount),
          payAmount: parseFloat(r.order.pay_amount),
          status: r.order.status,
          items: r.order.items ? r.order.items.map(i => ({
            id: i.id,
            productId: i.product_id,
            productName: i.product_name,
            productImage: i.product_image,
            price: parseFloat(i.price),
            quantity: i.quantity
          })) : []
        } : null
      }));

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: formattedRows,
          total: count,
          page: parseInt(page),
          size: parseInt(size)
        }
      });
    } catch (error) {
      console.error('List returns error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const returnOrder = await Return.findOne({
        where: { id, user_id: userId },
        include: [{
          model: Order,
          as: 'order',
          include: [{
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }]
        }]
      });

      if (!returnOrder) {
        return res.status(404).json({ code: 404, message: '退货申请不存在' });
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          id: returnOrder.id,
          orderId: returnOrder.order_id,
          reason: returnOrder.reason,
          description: returnOrder.description,
          images: returnOrder.images ? JSON.parse(returnOrder.images) : [],
          status: returnOrder.status,
          adminRemark: returnOrder.admin_remark,
          createdAt: returnOrder.created_at,
          order: returnOrder.order ? {
            id: returnOrder.order.id,
            orderNo: returnOrder.order.order_no,
            totalAmount: parseFloat(returnOrder.order.total_amount),
            payAmount: parseFloat(returnOrder.order.pay_amount),
            status: returnOrder.order.status
          } : null
        }
      });
    } catch (error) {
      console.error('Return detail error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async adminList(req, res) {
    try {
      const { page = 1, size = 10, status, keyword } = req.query;
      const where = {};

      if (status !== undefined && status !== '') {
        where.status = parseInt(status);
      }

      const { rows, count } = await Return.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
          { model: Order, as: 'order' }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size)
      });

      const formattedRows = rows.map(r => ({
        id: r.id,
        orderId: r.order_id,
        userId: r.user_id,
        user: r.user ? {
          id: r.user.id,
          nickname: r.user.nickname,
          phone: r.user.phone
        } : null,
        reason: r.reason,
        description: r.description,
        images: r.images ? JSON.parse(r.images) : [],
        status: r.status,
        adminRemark: r.admin_remark,
        createdAt: r.created_at,
        order: r.order ? {
          id: r.order.id,
          orderNo: r.order.order_no,
          totalAmount: parseFloat(r.order.total_amount),
          payAmount: parseFloat(r.order.pay_amount),
          status: r.order.status
        } : null
      }));

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: formattedRows,
          total: count,
          page: parseInt(page),
          size: parseInt(size)
        }
      });
    } catch (error) {
      console.error('Admin list returns error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async process(req, res) {
    try {
      const { id } = req.params;
      const { status, adminRemark } = req.body;

      const returnOrder = await Return.findByPk(id);

      if (!returnOrder) {
        return res.status(404).json({ code: 404, message: '退货申请不存在' });
      }

      await returnOrder.update({
        status,
        admin_remark: adminRemark
      });

      res.json({ code: 0, message: '处理成功' });
    } catch (error) {
      console.error('Process return error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = returnController;
