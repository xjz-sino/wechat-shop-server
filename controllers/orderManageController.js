const { Order, OrderItem, Product, User } = require('../models');
const { Op } = require('sequelize');

const orderManageController = {
  async getOrders(req, res) {
    try {
      const { status, keyword, startDate, endDate, page = 1, size = 10 } = req.query;

      const where = {};
      if (status !== undefined && status !== '') {
        where.status = parseInt(status);
      }
      if (keyword) {
        where[Op.or] = [
          { order_no: { [Op.like]: `%${keyword}%` } },
          { receiver_name: { [Op.like]: `%${keyword}%` } },
          { receiver_phone: { [Op.like]: `%${keyword}%` } }
        ];
      }
      // 日期筛选
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.created_at[Op.lte] = end;
        }
      }

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
          { model: OrderItem, as: 'items' }
        ],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const list = rows.map(o => {
        console.log('Order', o.id, 'remark:', o.remark); // 调试日志
        return {
        id: o.id,
        orderNo: o.order_no,
        userId: o.user_id,
        user: o.user ? { nickname: o.user.nickname, phone: o.user.phone } : null,
        totalAmount: parseFloat(o.total_amount),
        freightAmount: parseFloat(o.freight_amount),
        payAmount: parseFloat(o.pay_amount),
        status: o.status,
        payType: o.pay_type,
        payTime: o.pay_time,
        createdAt: o.created_at,
        remark: o.remark,
        shippingCompany: o.shipping_company,
        shippingNo: o.shipping_no,
        shippingTime: o.shipping_time,
        receiver: {
          name: o.receiver_name,
          phone: o.receiver_phone,
          province: o.receiver_province,
          city: o.receiver_city,
          district: o.receiver_district,
          detail: o.receiver_detail
        },
        items: o.items ? o.items.map(i => ({
          id: i.id,
          productId: i.product_id,
          skuId: i.sku_id,
          productName: i.product_name,
          productImage: i.product_image,
          price: parseFloat(i.price),
          quantity: i.quantity,
          totalPrice: parseFloat(i.total_price)
        })) : []
      }});

      res.json({
        code: 0,
        message: 'success',
        data: { list, total: count, page: parseInt(page), size: parseInt(size) }
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'nickname', 'phone', 'avatar'] },
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
        ]
      });

      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      // 格式化订单数据
      const orderData = {
        id: order.id,
        orderNo: order.order_no,
        userId: order.user_id,
        user: order.user ? { 
          id: order.user.id,
          nickname: order.user.nickname, 
          phone: order.user.phone,
          avatar: order.user.avatar
        } : null,
        totalAmount: parseFloat(order.total_amount),
        freightAmount: parseFloat(order.freight_amount),
        payAmount: parseFloat(order.pay_amount),
        status: order.status,
        payType: order.pay_type,
        payTime: order.pay_time,
        createdAt: order.created_at,
        remark: order.remark,
        receiver: {
          name: order.receiver_name,
          phone: order.receiver_phone,
          province: order.receiver_province,
          city: order.receiver_city,
          district: order.receiver_district,
          detail: order.receiver_detail
        },
        shippingCompany: order.shipping_company,
        shippingNo: order.shipping_no,
        shippingTime: order.shipping_time,
        items: order.items ? order.items.map(i => ({
          id: i.id,
          productId: i.product_id,
          skuId: i.sku_id,
          productName: i.product_name,
          productImage: i.product_image,
          price: parseFloat(i.price),
          quantity: i.quantity,
          totalPrice: parseFloat(i.total_price),
          product: i.product
        })) : []
      };

      res.json({ code: 0, message: 'success', data: orderData });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async shipOrder(req, res) {
    try {
      const { id } = req.params;
      const { shippingCompany, shippingNo } = req.body;

      if (!shippingCompany || !shippingNo) {
        return res.status(400).json({ code: 400, message: '请填写物流公司和单号' });
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 1) {
        return res.status(400).json({ code: 400, message: '订单状态不允许发货' });
      }

      await order.update({ 
        status: 2,
        shipping_company: shippingCompany,
        shipping_no: shippingNo,
        shipping_time: new Date()
      });

      res.json({ code: 0, message: '发货成功' });
    } catch (error) {
      console.error('Ship order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async confirmOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 2) {
        return res.status(400).json({ code: 400, message: '订单状态不允许完成' });
      }

      await order.update({ status: 3, receive_time: new Date() });

      res.json({ code: 0, message: '订单已完成' });
    } catch (error) {
      console.error('Confirm order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async refundOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      await order.update({ status: 5 });

      res.json({ code: 0, message: '已设置为退款中' });
    } catch (error) {
      console.error('Refund order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async confirmRefund(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 5) {
        return res.status(400).json({ code: 400, message: '订单状态不是退款中' });
      }

      await order.update({ status: 6 });

      res.json({ code: 0, message: '退款成功' });
    } catch (error) {
      console.error('Confirm refund error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const { status, receiverName, receiverPhone, receiverProvince, receiverCity, receiverDistrict, receiverDetail, remark, totalAmount, freightAmount, payAmount } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (receiverName !== undefined) updateData.receiver_name = receiverName;
      if (receiverPhone !== undefined) updateData.receiver_phone = receiverPhone;
      if (receiverProvince !== undefined) updateData.receiver_province = receiverProvince;
      if (receiverCity !== undefined) updateData.receiver_city = receiverCity;
      if (receiverDistrict !== undefined) updateData.receiver_district = receiverDistrict;
      if (receiverDetail !== undefined) updateData.receiver_detail = receiverDetail;
      if (remark !== undefined) updateData.remark = remark;
      if (totalAmount !== undefined) updateData.total_amount = totalAmount;
      if (freightAmount !== undefined) updateData.freight_amount = freightAmount;
      if (payAmount !== undefined) updateData.pay_amount = payAmount;

      await order.update(updateData);

      res.json({ code: 0, message: '订单修改成功' });
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      // 删除订单商品
      await OrderItem.destroy({ where: { order_id: id } });
      
      // 删除订单
      await order.destroy();

      res.json({ code: 0, message: '订单删除成功' });
    } catch (error) {
      console.error('Delete order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = orderManageController;
