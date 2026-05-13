const { Order, User, Product, Logistics, OrderItem } = require('../models');
const { createWechatPayOrder, generatePayParams } = require('../utils/wechat');
const { Op } = require('sequelize');

const paymentController = {
  async prepay(req, res) {
    try {
      const { orderId } = req.body;

      const order = await Order.findOne({
        where: { id: orderId, user_id: req.userId }
      });

      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 0) {
        return res.status(400).json({ code: 400, message: '订单状态不允许支付' });
      }

      const user = await User.findByPk(req.userId);
      
      const payResult = await createWechatPayOrder(
        order.order_no,
        parseFloat(order.pay_amount),
        order.items?.[0]?.product_name || '微信商城订单',
        user.openid
      );

      if (payResult.result_code === 'FAIL') {
        return res.status(400).json({ code: 400, message: payResult.error || '支付失败' });
      }

      const payParams = generatePayParams(payResult.prepay_id);

      res.json({
        code: 0,
        message: 'success',
        data: payParams
      });
    } catch (error) {
      console.error('Prepay error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async wxNotify(req, res) {
    try {
      const xmlData = req.body;
      const { parseWechatNotify } = require('../utils/wechat');
      
      const notifyData = await parseWechatNotify(xmlData);

      if (notifyData.return_code !== 'SUCCESS' || notifyData.result_code !== 'SUCCESS') {
        return res.xml({ return_code: 'FAIL', return_msg: '签名失败' });
      }

      const order = await Order.findOne({
        where: { order_no: notifyData.out_trade_no }
      });

      if (!order) {
        return res.xml({ return_code: 'FAIL', return_msg: '订单不存在' });
      }

      if (order.status === 0) {
        await order.update({
          status: 1,
          pay_type: 1,  // 1 表示微信支付
          pay_time: new Date()
        });

        await Logistics.create({
          order_id: order.id,
          status: 0
        });
      }

      res.xml({ return_code: 'SUCCESS', return_msg: 'OK' });
    } catch (error) {
      console.error('Wechat notify error:', error);
      res.xml({ return_code: 'FAIL', return_msg: '处理失败' });
    }
  }
};

module.exports = paymentController;
