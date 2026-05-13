const { Cart, Product, ProductSku, User } = require('../models');

const cartController = {
  async getCart(req, res) {
    try {
      const carts = await Cart.findAll({
        where: { user_id: req.userId },
        include: [
          { model: Product, as: 'product' },
          { model: ProductSku, as: 'sku' }
        ],
        order: [['created_at', 'DESC']]
      });

      const list = carts.map(c => ({
        id: c.id,
        productId: c.product_id,
        skuId: c.sku_id,
        quantity: c.quantity,
        product: c.product ? {
          id: c.product.id,
          name: c.product.name,
          price: parseFloat(c.product.price),
          image: JSON.parse(c.product.images)[0],
          stock: c.product.stock
        } : null,
        sku: c.sku ? {
          specs: JSON.parse(c.sku.specs),
          price: parseFloat(c.sku.price),
          stock: c.sku.stock
        } : null
      }));

      const totalAmount = list.reduce((sum, item) => {
        const price = item.sku ? item.sku.price : item.product.price;
        return sum + price * item.quantity;
      }, 0);

      res.json({
        code: 0,
        message: 'success',
        data: { list, totalAmount: totalAmount.toFixed(2) }
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async addCart(req, res) {
    try {
      const { productId, skuId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ code: 400, message: '请选择商品' });
      }

      const product = await Product.findByPk(productId);
      if (!product || product.status === 0) {
        return res.status(404).json({ code: 404, message: '商品不存在或已下架' });
      }

      if (skuId) {
        const sku = await ProductSku.findOne({ where: { id: skuId, product_id: productId } });
        if (!sku || sku.status === 0) {
          return res.status(404).json({ code: 404, message: '商品规格不存在' });
        }
        if (sku.stock < quantity) {
          return res.status(400).json({ code: 400, message: '库存不足' });
        }
      } else {
        if (product.stock < quantity) {
          return res.status(400).json({ code: 400, message: '库存不足' });
        }
      }

      let cart = await Cart.findOne({ where: { user_id: req.userId, product_id: productId, sku_id: skuId || null } });

      if (cart) {
        const newQuantity = cart.quantity + quantity;
        if (skuId) {
          const sku = await ProductSku.findByPk(skuId);
          if (sku.stock < newQuantity) {
            return res.status(400).json({ code: 400, message: '库存不足' });
          }
        } else {
          if (product.stock < newQuantity) {
            return res.status(400).json({ code: 400, message: '库存不足' });
          }
        }
        await cart.update({ quantity: newQuantity });
      } else {
        cart = await Cart.create({
          user_id: req.userId,
          product_id: productId,
          sku_id: skuId || null,
          quantity
        });
      }

      res.json({ code: 0, message: '添加成功', data: cart });
    } catch (error) {
      console.error('Add cart error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateCart(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const cart = await Cart.findOne({ where: { id, user_id: req.userId } });
      if (!cart) {
        return res.status(404).json({ code: 404, message: '购物车商品不存在' });
      }

      if (quantity <= 0) {
        await cart.destroy();
        return res.json({ code: 0, message: '删除成功' });
      }

      if (cart.sku_id) {
        const sku = await ProductSku.findByPk(cart.sku_id);
        if (sku.stock < quantity) {
          return res.status(400).json({ code: 400, message: '库存不足' });
        }
      } else {
        const product = await Product.findByPk(cart.product_id);
        if (product.stock < quantity) {
          return res.status(400).json({ code: 400, message: '库存不足' });
        }
      }

      await cart.update({ quantity });

      res.json({ code: 0, message: '更新成功', data: cart });
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteCart(req, res) {
    try {
      const { id } = req.params;

      const cart = await Cart.findOne({ where: { id, user_id: req.userId } });
      if (!cart) {
        return res.status(404).json({ code: 404, message: '购物车商品不存在' });
      }

      await cart.destroy();

      res.json({ code: 0, message: '删除成功' });
    } catch (error) {
      console.error('Delete cart error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async clearCart(req, res) {
    try {
      await Cart.destroy({ where: { user_id: req.userId } });

      res.json({ code: 0, message: '清空成功' });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = cartController;
