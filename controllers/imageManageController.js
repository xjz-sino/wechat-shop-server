const fs = require('fs');
const path = require('path');
const config = require('../config');

const baseUploadDir = path.join(__dirname, '../../', config.upload.path);

// 图片分类配置
const CATEGORY_CONFIG = {
  product: { name: '商品图片', path: 'product' },
  decoration: { name: '装饰图片', path: 'decoration' },
  detail: { name: '详情图片', path: 'detail' },
  all: { name: '全部图片', path: '' }
};

const imageManageController = {
  // 获取图片列表
  async getImages(req, res) {
    try {
      const { page = 1, size = 20, keyword = '', category = 'all' } = req.query;
      
      let allImages = [];
      
      // 根据分类获取图片
      if (category === 'all') {
        // 获取所有分类的图片
        Object.keys(CATEGORY_CONFIG).forEach(cat => {
          if (cat !== 'all') {
            const catImages = imageManageController._getImagesByCategory(cat);
            allImages = allImages.concat(catImages);
          }
        });
      } else {
        allImages = imageManageController._getImagesByCategory(category);
      }
      
      // 按时间排序
      allImages.sort((a, b) => b.createdAt - a.createdAt);

      // 搜索过滤
      if (keyword) {
        allImages = allImages.filter(img => img.filename.includes(keyword));
      }

      // 分页
      const total = allImages.length;
      const start = (parseInt(page) - 1) * parseInt(size);
      const end = start + parseInt(size);
      const list = allImages.slice(start, end);

      res.json({
        code: 0,
        message: 'success',
        data: { list, total, page: parseInt(page), size: parseInt(size) }
      });
    } catch (error) {
      console.error('Get images error:', error);
      res.status(500).json({ code: 500, message: '获取图片列表失败' });
    }
  },

  // 内部方法：获取指定分类的图片
  _getImagesByCategory(category) {
    const catConfig = CATEGORY_CONFIG[category];
    if (!catConfig || category === 'all') return [];

    const catDir = path.join(baseUploadDir, catConfig.path);
    if (!fs.existsSync(catDir)) {
      return [];
    }

    const files = fs.readdirSync(catDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => {
        const stat = fs.statSync(path.join(catDir, file));
        return {
          filename: file,
          url: `${config.upload.urlPrefix}/${catConfig.path}/${file}`,
          category: category,
          categoryName: catConfig.name,
          size: stat.size,
          createdAt: stat.birthtime
        };
      });
  },

  // 删除图片
  async deleteImage(req, res) {
    try {
      const { filename } = req.params;
      const { category = 'product' } = req.query;
      
      if (!filename) {
        return res.status(400).json({ code: 400, message: '请提供文件名' });
      }

      const catConfig = CATEGORY_CONFIG[category];
      const catDir = catConfig ? path.join(baseUploadDir, catConfig.path) : baseUploadDir;
      const filePath = path.join(catDir, filename);
      
      // 安全检查：确保文件在 uploads 目录内
      if (!filePath.startsWith(baseUploadDir)) {
        return res.status(400).json({ code: 400, message: '非法的文件路径' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ code: 404, message: '文件不存在' });
      }

      fs.unlinkSync(filePath);

      res.json({
        code: 0,
        message: '删除成功'
      });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({ code: 500, message: '删除失败' });
    }
  },

  // 批量删除图片
  async batchDeleteImages(req, res) {
    try {
      const { images } = req.body;
      
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ code: 400, message: '请提供要删除的图片列表' });
      }

      const results = [];
      for (const img of images) {
        const { filename, category = 'product' } = img;
        const catConfig = CATEGORY_CONFIG[category];
        const catDir = catConfig ? path.join(baseUploadDir, catConfig.path) : baseUploadDir;
        const filePath = path.join(catDir, filename);
        
        // 安全检查
        if (!filePath.startsWith(baseUploadDir)) {
          results.push({ filename, success: false, message: '非法的文件路径' });
          continue;
        }

        if (!fs.existsSync(filePath)) {
          results.push({ filename, success: false, message: '文件不存在' });
          continue;
        }

        try {
          fs.unlinkSync(filePath);
          results.push({ filename, success: true });
        } catch (err) {
          results.push({ filename, success: false, message: err.message });
        }
      }

      res.json({
        code: 0,
        message: '操作完成',
        data: results
      });
    } catch (error) {
      console.error('Batch delete images error:', error);
      res.status(500).json({ code: 500, message: '批量删除失败' });
    }
  },

  // 获取图片统计信息
  async getImageStats(req, res) {
    try {
      const stats = {
        totalCount: 0,
        totalSize: 0,
        categoryStats: {},
        formatStats: {}
      };

      Object.keys(CATEGORY_CONFIG).forEach(cat => {
        if (cat === 'all') return;
        
        const catImages = imageManageController._getImagesByCategory(cat);
        const catSize = catImages.reduce((sum, img) => sum + img.size, 0);
        
        stats.categoryStats[cat] = {
          name: CATEGORY_CONFIG[cat].name,
          count: catImages.length,
          size: catSize
        };
        
        stats.totalCount += catImages.length;
        stats.totalSize += catSize;

        // 格式统计
        catImages.forEach(img => {
          const ext = path.extname(img.filename).toLowerCase();
          if (!stats.formatStats[ext]) {
            stats.formatStats[ext] = { count: 0, size: 0 };
          }
          stats.formatStats[ext].count++;
          stats.formatStats[ext].size += img.size;
        });
      });

      res.json({
        code: 0,
        message: 'success',
        data: stats
      });
    } catch (error) {
      console.error('Get image stats error:', error);
      res.status(500).json({ code: 500, message: '获取统计信息失败' });
    }
  },

  // 获取分类列表
  async getCategories(req, res) {
    try {
      const categories = Object.keys(CATEGORY_CONFIG).map(key => ({
        key,
        name: CATEGORY_CONFIG[key].name
      })).filter(cat => cat.key !== 'all');

      res.json({
        code: 0,
        message: 'success',
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ code: 500, message: '获取分类列表失败' });
    }
  }
};

module.exports = imageManageController;
