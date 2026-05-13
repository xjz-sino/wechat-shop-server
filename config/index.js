module.exports = {
  port: process.env.PORT || 3000,
  
  jwt: {
    secret: process.env.JWT_SECRET || 'wechat-shop-secret-key-2024',
    expiresIn: '7d'
  },
  
  jwtAdmin: {
    secret: process.env.JWT_ADMIN_SECRET || 'wechat-shop-admin-secret-key-2024',
    expiresIn: '24h'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Mysql123123.',
    database: process.env.DB_NAME || 'wechat_shop',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  wechat: {
    appId: process.env.WECHAT_APPID || 'wxa5da674564aa661b',
    appSecret: process.env.WECHAT_SECRET || '532164081c5e036edc0ecc59a984f863',
    mchId: process.env.WECHAT_MCHID || 'your_mchid',
    mchKey: process.env.WECHAT_MCHKEY || 'your_mchkey',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://yourdomain.com/api/payment/wx/notify'
  },
  
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads',
    urlPrefix: process.env.UPLOAD_URL_PREFIX || 'http://localhost:3000/uploads',
    maxSize: 5 * 1024 * 1024
  }
};
