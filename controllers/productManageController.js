const { Product, ProductSku, Category } = require('../models');
const { Op } = require('sequelize');
const { parseImages } = require('../utils/imageHelper');

const productManageController = {
  async getProducts(req, res) {
    try {
      const { keyword, categoryId, status, is_pre_sale, page = 1, size = 10 } = req.query;

      const where = {};
      if (keyword) {
        where.name = { [Op.like]: `%${keyword}%` };
      }
      if (categoryId) {
        where.category_id = categoryId;
      }
      if (status !== undefined && status !== '') {
        where.status = parseInt(status);
      }
      if (is_pre_sale !== undefined && is_pre_sale !== '') {
        where.is_pre_sale = parseInt(is_pre_sale);
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const list = rows.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.category_id,
        categoryName: p.category ? p.category.name : null,
        images: parseImages(p.images),
        detail_images: parseImages(p.detail_images),
        price: parseFloat(p.price),
        originalPrice: parseFloat(p.original_price || 0),
        stock: p.stock,
        sales: p.sales,
        isPreSale: p.is_pre_sale,
        preSaleDeposit: parseFloat(p.pre_sale_deposit || 0),
        preSaleEndTime: p.pre_sale_end_time,
        preSaleDeliveryTime: p.pre_sale_delivery_time,
        status: p.status,
        createdAt: p.created_at
      }));

      res.json({
        code: 0,
        message: 'success',
        data: { list, total: count, page: parseInt(page), size: parseInt(size) }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [{ model: ProductSku, as: 'skus' }]
      });

      if (!product) {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          id: product.id,
          name: product.name,
          categoryId: product.category_id,
          categoryIds: product.category_ids,
          images: parseImages(product.images),
          detail_images: parseImages(product.detail_images),
          description: product.description,
          price: parseFloat(product.price),
          originalPrice: parseFloat(product.original_price || 0),
          stock: product.stock,
          sales: product.sales,
          isPreSale: product.is_pre_sale,
          preSaleDeposit: product.pre_sale_deposit ? parseFloat(product.pre_sale_deposit) : null,
          preSaleEndTime: product.pre_sale_end_time,
          preSaleDeliveryTime: product.pre_sale_delivery_time,
          specs: product.specs ? JSON.parse(product.specs) : [],
          skus: product.skus.map(s => ({
            id: s.id,
            specs: JSON.parse(s.specs),
            price: parseFloat(s.price),
            originalPrice: parseFloat(s.original_price || 0),
            stock: s.stock,
            image: s.image,
            status: s.status
          })),
          status: product.status
        }
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async createProduct(req, res) {
    try {
      const {
        name, categoryId, categoryIds, images, detailImages, description,
        price, originalPrice, stock, isPreSale, preSaleDeposit,
        preSaleEndTime, preSaleDeliveryTime, specs, skus
      } = req.body;

      console.log('Create product request:', req.body);

      if (!name) {
        return res.status(400).json({ code: 400, message: '请输入商品名称' });
      }
      if (!categoryId) {
        return res.status(400).json({ code: 400, message: '请选择商品分类' });
      }
      if (!images || (Array.isArray(images) && images.length === 0)) {
        return res.status(400).json({ code: 400, message: '请上传商品图片' });
      }
      if (!price) {
        return res.status(400).json({ code: 400, message: '请输入商品价格' });
      }

      const product = await Product.create({
        name,
        category_id: categoryId,
        category_ids: categoryIds,
        images: JSON.stringify(images),
        detail_images: detailImages ? JSON.stringify(detailImages) : null,
        description,
        price,
        original_price: originalPrice,
        stock: stock || 0,
        is_pre_sale: isPreSale || 0,
        pre_sale_deposit: preSaleDeposit,
        pre_sale_end_time: preSaleEndTime,
        pre_sale_delivery_time: preSaleDeliveryTime,
        specs: specs ? JSON.stringify(specs) : null,
        status: 1
      });

      if (skus && skus.length > 0) {
        for (const sku of skus) {
          await ProductSku.create({
            product_id: product.id,
            specs: JSON.stringify(sku.specs),
            price: sku.price,
            original_price: sku.originalPrice,
            stock: sku.stock || 0,
            image: sku.image,
            status: 1
          });
        }
      }

      res.json({ code: 0, message: '创建成功', data: product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        name, categoryId, categoryIds, images, detailImages, description,
        price, originalPrice, stock, isPreSale, preSaleDeposit,
        preSaleEndTime, preSaleDeliveryTime, specs, skus
      } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      await product.update({
        name,
        category_id: categoryId,
        category_ids: categoryIds,
        images: images ? JSON.stringify(images) : product.images,
        detail_images: detailImages ? JSON.stringify(detailImages) : product.detail_images,
        description,
        price,
        original_price: originalPrice,
        stock: stock,
        is_pre_sale: isPreSale,
        pre_sale_deposit: preSaleDeposit,
        pre_sale_end_time: preSaleEndTime,
        pre_sale_delivery_time: preSaleDeliveryTime,
        specs: specs ? JSON.stringify(specs) : product.specs
      });

      if (skus && skus.length > 0) {
        await ProductSku.destroy({ where: { product_id: id } });
        for (const sku of skus) {
          await ProductSku.create({
            product_id: id,
            specs: JSON.stringify(sku.specs),
            price: sku.price,
            original_price: sku.originalPrice,
            stock: sku.stock || 0,
            image: sku.image,
            status: 1
          });
        }
      }

      res.json({ code: 0, message: '更新成功', data: product });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      await product.update({ status });

      res.json({ code: 0, message: '状态更新成功' });
    } catch (error) {
      console.error('Update product status error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      await product.destroy();

      res.json({ code: 0, message: '删除成功' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getCategories(req, res) {
    try {
      const categories = await Category.findAll({
        where: { status: 1 },
        order: [['sort', 'ASC']]
      });

      res.json({ code: 0, message: 'success', data: categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async createCategory(req, res) {
    try {
      const { parentId, name, icon, sort } = req.body;

      if (!name) {
        return res.status(400).json({ code: 400, message: '请输入分类名称' });
      }

      const category = await Category.create({
        parent_id: parentId || 0,
        name,
        icon: icon || '',
        sort: sort || 0,
        status: 1
      });

      res.json({ code: 0, message: '创建成功', data: category });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { parentId, name, icon, sort } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ code: 404, message: '分类不存在' });
      }

      await category.update({
        parent_id: parentId !== undefined ? parentId : category.parent_id,
        name: name || category.name,
        icon: icon !== undefined ? icon : category.icon,
        sort: sort !== undefined ? sort : category.sort
      });

      res.json({ code: 0, message: '更新成功', data: category });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ code: 404, message: '分类不存在' });
      }

      // 检查是否有子分类
      const children = await Category.findAll({ where: { parent_id: id } });
      if (children.length > 0) {
        return res.status(400).json({ code: 400, message: '请先删除子分类' });
      }

      // 检查是否有商品使用该分类
      const products = await Product.findAll({ where: { category_id: id } });
      if (products.length > 0) {
        return res.status(400).json({ code: 400, message: '该分类下存在商品，无法删除' });
      }

      await category.destroy();

      res.json({ code: 0, message: '删除成功' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = productManageController;
