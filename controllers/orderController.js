const { Order, OrderItem, Cart, Product, ProductSku, Address, sequelize } = require('../models');
const { generateNonceStr } = require('../utils/wechat');

const orderController = {
  async preOrder(req, res) {
    try {
      const { cartIds, items: directItems, addressId } = req.body;

      // 如果没有传入 addressId，尝试获取默认地址
      let address = null;
      if (addressId) {
        address = await Address.findOne({ where: { id: addressId, user_id: req.userId } });
      } else {
        // 尝试获取用户的默认地址
        address = await Address.findOne({ 
          where: { user_id: req.userId, is_default: true } 
        });
        // 如果没有默认地址，获取第一个地址
        if (!address) {
          address = await Address.findOne({ 
            where: { user_id: req.userId },
            order: [['created_at', 'DESC']]
          });
        }
      }

      let items = [];
      let totalAmount = 0;

      // 处理购物车商品
      if (cartIds && cartIds.length > 0) {
        const carts = await Cart.findAll({
          where: { id: cartIds, user_id: req.userId },
          include: [
            { model: Product, as: 'product' },
            { model: ProductSku, as: 'sku' }
          ]
        });

        if (carts.length === 0) {
          return res.status(400).json({ code: 400, message: '请选择商品' });
        }

        for (const cart of carts) {
          const price = cart.sku ? parseFloat(cart.sku.price) : parseFloat(cart.product.price);
          const itemTotal = price * cart.quantity;
          totalAmount += itemTotal;

          items.push({
            productId: cart.product_id,
            skuId: cart.sku_id,
            productName: cart.product.name,
            productImage: JSON.parse(cart.product.images)[0],
            skuSpecs: cart.sku ? cart.sku.specs : null,
            price,
            quantity: cart.quantity
          });
        }
      }

      // 处理直接购买商品
      if (directItems && directItems.length > 0) {
        for (const item of directItems) {
          const product = await Product.findByPk(item.productId);
          if (!product) continue;

          let price = parseFloat(product.price);
          let skuSpecs = null;

          if (item.skuId) {
            const sku = await ProductSku.findByPk(item.skuId);
            if (sku) {
              price = parseFloat(sku.price);
              skuSpecs = sku.specs;
            }
          }

          const itemTotal = price * item.quantity;
          totalAmount += itemTotal;

          items.push({
            productId: item.productId,
            skuId: item.skuId,
            productName: product.name,
            productImage: JSON.parse(product.images)[0],
            skuSpecs: skuSpecs,
            price,
            quantity: item.quantity
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ code: 400, message: '请选择商品' });
      }

      const freightAmount = totalAmount >= 99 ? 0 : 10;
      const payAmount = totalAmount + freightAmount;

      const responseData = {
        items,
        totalAmount: totalAmount.toFixed(2),
        freightAmount: freightAmount.toFixed(2),
        payAmount: payAmount.toFixed(2)
      };

      // 如果有地址，添加到响应中
      if (address) {
        responseData.address = {
          id: address.id,
          name: address.name,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          detail: address.detail
        };
      }

      res.json({
        code: 0,
        message: 'success',
        data: responseData
      });
    } catch (error) {
      console.error('Pre order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async createOrder(req, res) {
    try {
      const { cartIds, addressId, items, remark } = req.body;
      console.log('Create order - remark:', remark); // 调试日志

      if (!addressId) {
        return res.status(400).json({ code: 400, message: '请选择收货地址' });
      }

      const address = await Address.findOne({ where: { id: addressId, user_id: req.userId } });
      if (!address) {
        return res.status(404).json({ code: 404, message: '收货地址不存在' });
      }

      let orderItems = [];
      let totalAmount = 0;

      if (cartIds && cartIds.length > 0) {
        const carts = await Cart.findAll({
          where: { id: cartIds, user_id: req.userId },
          include: [
            { model: Product, as: 'product' },
            { model: ProductSku, as: 'sku' }
          ]
        });

        if (carts.length === 0) {
          return res.status(400).json({ code: 400, message: '购物车商品不存在' });
        }

        for (const cart of carts) {
          const price = cart.sku ? parseFloat(cart.sku.price) : parseFloat(cart.product.price);
          const itemTotal = price * cart.quantity;
          totalAmount += itemTotal;

          orderItems.push({
            product_id: cart.product_id,
            sku_id: cart.sku_id,
            product_name: cart.product.name,
            product_image: JSON.parse(cart.product.images)[0],
            price,
            quantity: cart.quantity,
            total_price: itemTotal
          });

          await Product.increment('sales', { by: cart.quantity, where: { id: cart.product_id } });
        }

        await Cart.destroy({ where: { id: cartIds } });
      } else if (items && items.length > 0) {
        for (const item of items) {
          const product = await Product.findByPk(item.productId);
          if (!product) continue;

          let price = parseFloat(product.price);
          let sku = null;

          if (item.skuId) {
            sku = await ProductSku.findByPk(item.skuId);
            if (sku) price = parseFloat(sku.price);
          }

          const itemTotal = price * item.quantity;
          totalAmount += itemTotal;

          orderItems.push({
            product_id: item.productId,
            sku_id: item.skuId || null,
            product_name: product.name,
            product_image: JSON.parse(product.images)[0],
            price,
            quantity: item.quantity,
            total_price: itemTotal
          });

          await Product.increment('sales', { by: item.quantity, where: { id: item.productId } });
        }
      } else {
        return res.status(400).json({ code: 400, message: '请选择商品' });
      }

      const freightAmount = totalAmount >= 99 ? 0 : 10;
      const payAmount = totalAmount + freightAmount;

      const orderNo = 'O' + Date.now() + generateNonceStr(8);

      const order = await Order.create({
        order_no: orderNo,
        user_id: req.userId,
        total_amount: totalAmount,
        freight_amount: freightAmount,
        pay_amount: payAmount,
        remark,
        status: 0,
        receiver_name: address.name,
        receiver_phone: address.phone,
        receiver_province: address.province,
        receiver_city: address.city,
        receiver_district: address.district,
        receiver_detail: address.detail
      });

      for (const item of orderItems) {
        item.order_id = order.id;
      }

      await OrderItem.bulkCreate(orderItems);

      res.json({
        code: 0,
        message: '订单创建成功',
        data: { orderId: order.id, orderNo: order.order_no }
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getOrders(req, res) {
    try {
      const { status, page = 1, size = 10 } = req.query;

      const where = { user_id: req.userId };
      if (status !== undefined && status !== '') {
        where.status = parseInt(status);
      }

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
        ],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const list = rows.map(o => ({
        id: o.id,
        orderNo: o.order_no,
        status: o.status,
        totalAmount: parseFloat(o.total_amount),
        freightAmount: parseFloat(o.freight_amount),
        payAmount: parseFloat(o.pay_amount),
        createdAt: o.created_at,
        items: o.items.map(i => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          productImage: i.product_image,
          price: parseFloat(i.price),
          quantity: i.quantity
        }))
      }));

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

  async getOrderDetail(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: { id, user_id: req.userId },
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
        ]
      });

      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          id: order.id,
          orderNo: order.order_no,
          status: order.status,
          totalAmount: parseFloat(order.total_amount),
          freightAmount: parseFloat(order.freight_amount),
          payAmount: parseFloat(order.pay_amount),
          remark: order.remark,
          payTime: order.pay_time,
          createdAt: order.created_at,
          receiver: {
            name: order.receiver_name,
            phone: order.receiver_phone,
            province: order.receiver_province,
            city: order.receiver_city,
            district: order.receiver_district,
            detail: order.receiver_detail
          },
          items: order.items.map(i => ({
            id: i.id,
            productId: i.product_id,
            productName: i.product_name,
            productImage: i.product_image,
            price: parseFloat(i.price),
            quantity: i.quantity
          }))
        }
      });
    } catch (error) {
      console.error('Get order detail error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async cancelOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({ where: { id, user_id: req.userId } });
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 0) {
        return res.status(400).json({ code: 400, message: '订单状态不允许取消' });
      }

      await order.update({ status: 4 });

      res.json({ code: 0, message: '订单取消成功' });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async confirmReceive(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({ where: { id, user_id: req.userId } });
      if (!order) {
        return res.status(404).json({ code: 404, message: '订单不存在' });
      }

      if (order.status !== 3) {
        return res.status(400).json({ code: 400, message: '订单状态不允许确认收货' });
      }

      await order.update({ status: 4, receive_time: new Date() });

      res.json({ code: 0, message: '确认收货成功' });
    } catch (error) {
      console.error('Confirm receive error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = orderController;
