const config = require('../config');

/**
 * 安全解析图片字段
 * @param {string} imagesStr - 数据库中存储的图片字段
 * @returns {string[]} - 图片 URL 数组
 */
function parseImages(imagesStr) {
  if (!imagesStr) {
    return [];
  }

  // 如果已经是数组，直接返回
  if (Array.isArray(imagesStr)) {
    return imagesStr.map(img => ensureFullUrl(img));
  }

  // 如果是字符串，尝试解析
  if (typeof imagesStr === 'string') {
    // 如果是 JSON 数组格式（以 [ 开头）
    if (imagesStr.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(imagesStr);
        if (Array.isArray(parsed)) {
          return parsed.map(img => ensureFullUrl(img));
        }
        return [ensureFullUrl(parsed)];
      } catch (e) {
        console.error('Parse images error:', imagesStr, e.message);
        // 解析失败，作为普通字符串处理
        return [ensureFullUrl(imagesStr)];
      }
    }

    // 如果是单个 URL 字符串
    return [ensureFullUrl(imagesStr)];
  }

  return [];
}

/**
 * 确保图片 URL 是完整的
 * @param {string} url - 图片 URL
 * @returns {string} - 完整的图片 URL
 */
function ensureFullUrl(url) {
  if (!url) {
    return '';
  }

  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是相对路径，拼接 BASE_URL
  if (url.startsWith('/')) {
    return `${config.upload.urlPrefix}${url}`;
  }

  // 其他情况，添加 /
  return `${config.upload.urlPrefix}/${url}`;
}

/**
 * 获取第一张图片
 * @param {string} imagesStr - 数据库中存储的图片字段
 * @returns {string} - 第一张图片的 URL
 */
function getFirstImage(imagesStr) {
  const images = parseImages(imagesStr);
  return images[0] || '';
}

module.exports = {
  parseImages,
  ensureFullUrl,
  getFirstImage
};
