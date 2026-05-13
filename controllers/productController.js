const { Category, Product, ProductSku, HomeConfig } = require('../models');
const { Op } = require('sequelize');
const { parseImages, getFirstImage } = require('../utils/imageHelper');

// 基础 URL，用于拼接图片地址
const BASE_URL = 'http://localhost:3000';

const productController = {
  async getHomeConfig(req, res) {
    try {
      const banners = await HomeConfig.findAll({
        where: { type: 'banner', status: 1 },
        order: [['sort', 'ASC']]
      });

      const icons = await HomeConfig.findAll({
        where: { type: 'icon', status: 1 },
        order: [['sort', 'ASC']]
      });

      const recommendProducts = await Product.findAll({
        where: { status: 1 },
        limit: 10,
        order: [['sales', 'DESC']]
      });

      // 解析 banner 数据
      let bannerList = [];
      banners.forEach(b => {
        try {
          const content = JSON.parse(b.content || '{}');
          // 兼容新旧数据格式
          if (content.items && Array.isArray(content.items)) {
            // 旧格式：{items: [...]}
            bannerList = bannerList.concat(content.items.map((item, idx) => {
              let image = item.image;
              if (image && !image.startsWith('http')) {
                image = BASE_URL + image;
              }
              return {
                id: `${b.id}-${idx}`,
                image: image,
                link: item.link || ''
              };
            }));
          } else if (content.image) {
            // 新格式：{image: "url", link: ""}
            let image = content.image;
            if (image && !image.startsWith('http')) {
              image = BASE_URL + image;
            }
            bannerList.push({
              id: `${b.id}-0`,
              image: image,
              link: content.link || ''
            });
          }
        } catch (e) {
          console.error('Parse banner content error:', e);
        }
      });

      // 解析 icon 数据
      let iconList = [];
      icons.forEach(i => {
        try {
          const content = JSON.parse(i.content || '{}');
          // 兼容新旧数据格式
          if (content.items && Array.isArray(content.items)) {
            // 旧格式
            iconList = iconList.concat(content.items.map((item, idx) => {
              let image = item.icon || item.image;
              if (image && !image.startsWith('http')) {
                image = BASE_URL + image;
              }
              return {
                id: `${i.id}-${idx}`,
                title: item.name || item.title || i.title,
                image: image,
                link: item.link || ''
              };
            }));
          } else if (content.image) {
            // 新格式
            let image = content.image;
            if (image && !image.startsWith('http')) {
              image = BASE_URL + image;
            }
            iconList.push({
              id: `${i.id}-0`,
              title: i.title,
              image: image,
              link: content.link || ''
            });
          }
        } catch (e) {
          console.error('Parse icon content error:', e);
        }
      });

      console.log('Home config response:', { banners: bannerList, icons: iconList });
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          banners: bannerList,
          icons: iconList,
          recommendProducts: recommendProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price),
            image: getFirstImage(p.images)
          }))
        }
      });
    } catch (error) {
      console.error('Get home config error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getCategories(req, res) {
    try {
      const categories = await Category.findAll({
        where: { status: 1 },
        order: [['sort', 'ASC']]
      });

      const tree = [];
      const map = {};

      categories.forEach(cat => {
        map[cat.id] = { ...cat.toJSON(), children: [] };
      });

      categories.forEach(cat => {
        if (cat.parent_id === 0) {
          tree.push(map[cat.id]);
        } else if (map[cat.parent_id]) {
          map[cat.parent_id].children.push(map[cat.id]);
        }
      });

      res.json({ code: 0, message: 'success', data: tree });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getProducts(req, res) {
    try {
      const { categoryId, keyword, page = 1, size = 10, isPreSale } = req.query;

      const where = { status: 1 };

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (keyword) {
        where.name = { [Op.like]: `%${keyword}%` };
      }

      if (isPreSale !== undefined) {
        where.is_pre_sale = isPreSale === '1' ? 1 : 0;
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [{ model: ProductSku, as: 'skus', where: { status: 1 }, required: false }],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']]
      });

      const products = rows.map(p => {
        // 使用工具函数安全解析图片
        const image = getFirstImage(p.images);
        
        return {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          originalPrice: parseFloat(p.original_price || 0),
          image: image,
          sales: p.sales,
          isPreSale: p.is_pre_sale
        };
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: products,
          total: count,
          page: parseInt(page),
          size: parseInt(size)
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getProductDetail(req, res) {
    try {
      const { id } = req.params;

      // 先查询商品基本信息
      const product = await Product.findByPk(id, {
        include: [
          { model: Category, as: 'category' }
        ]
      });

      if (!product) {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      // 单独查询 SKU 信息
      const skus = await ProductSku.findAll({
        where: { product_id: id, status: 1 }
      });

      // 安全解析图片
      // 使用工具函数安全解析图片
      const images = parseImages(product.images);

      res.json({
        code: 0,
        message: 'success',
        data: {
          id: product.id,
          name: product.name,
          categoryId: product.category_id,
          images: images,
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
          skus: skus.map(s => ({
            id: s.id,
            specs: JSON.parse(s.specs),
            price: parseFloat(s.price),
            originalPrice: parseFloat(s.original_price || 0),
            stock: s.stock,
            image: s.image
          })),
          categoryName: product.category ? product.category.name : null
        }
      });
    } catch (error) {
      console.error('Get product detail error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getPreSaleList(req, res) {
    try {
      const { page = 1, size = 10 } = req.query;

      // 添加查询超时控制
      const { count, rows } = await Product.findAndCountAll({
        where: { status: 1, is_pre_sale: 1 },
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [['created_at', 'DESC']],
        raw: true
      });

      // 使用工具函数安全解析图片
      const products = rows.map(p => {
        const image = getFirstImage(p.images);
        
        return {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price || 0),
          deposit: parseFloat(p.pre_sale_deposit || 0),
          image: image,
          endTime: p.pre_sale_end_time,
          deliveryTime: p.pre_sale_delivery_time
        };
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: products,
          total: count,
          page: parseInt(page),
          size: parseInt(size)
        }
      });
    } catch (error) {
      console.error('Get pre-sale list error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async getPreSaleDetail(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [{ model: ProductSku, as: 'skus', where: { status: 1 } }]
      });

      if (!product || !product.is_pre_sale) {
        return res.status(404).json({ code: 404, message: '预售商品不存在' });
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          id: product.id,
          name: product.name,
          images: parseImages(product.images),
          description: product.description,
          price: parseFloat(product.price),
          deposit: parseFloat(product.pre_sale_deposit || 0),
          endTime: product.pre_sale_end_time,
          deliveryTime: product.pre_sale_delivery_time,
          skus: product.skus.map(s => ({
            id: s.id,
            specs: JSON.parse(s.specs),
            price: parseFloat(s.price),
            deposit: parseFloat((parseFloat(s.price) * 0.1).toFixed(2))
          }))
        }
      });
    } catch (error) {
      console.error('Get pre-sale detail error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = productController;
