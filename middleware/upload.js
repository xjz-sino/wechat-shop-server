const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const baseUploadDir = path.join(__dirname, '../../', config.upload.path);

// 确保基础上传目录存在
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// 创建分类目录
const categories = ['product', 'decoration', 'detail'];
categories.forEach(cat => {
  const catDir = path.join(baseUploadDir, cat);
  if (!fs.existsSync(catDir)) {
    fs.mkdirSync(catDir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据分类参数选择目录
    const category = req.query.category || 'product';
    const validCategories = ['product', 'decoration', 'detail'];
    const targetDir = validCategories.includes(category) 
      ? path.join(baseUploadDir, category)
      : baseUploadDir;
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的图片格式'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize
  }
});

module.exports = upload;
