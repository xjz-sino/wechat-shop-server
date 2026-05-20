const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
  config.database.database,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool
  }
);

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  openid: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  avatar: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  phone: {
    type: DataTypes.STRING(20),
    defaultValue: null
  },
  referrer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: null,
    comment: '推荐人ID'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  province: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  detail: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  is_default: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  tableName: 'addresses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  icon: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  category_ids: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  detail_images: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_pre_sale: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  pre_sale_deposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null
  },
  pre_sale_end_time: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  pre_sale_delivery_time: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  specs: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ProductSku = sequelize.define('ProductSku', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  specs: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'product_skus',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sku_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: null
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'carts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_no: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  freight_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pay_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pay_type: {
    type: DataTypes.TINYINT,
    defaultValue: null
  },
  pay_time: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  receiver_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  receiver_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  receiver_province: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  receiver_city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  receiver_district: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  receiver_detail: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  remark: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  shipping_company: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  shipping_no: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  shipping_time: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  receive_time: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sku_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: null
  },
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  product_image: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Logistics = sequelize.define('Logistics', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  shipping_company: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  shipping_no: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  traces: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  ship_time: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  delivered_time: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, {
  tableName: 'logistics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  score: {
    type: DataTypes.TINYINT,
    defaultValue: 5
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  images: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'chat_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sender_type: {
    type: DataTypes.TINYINT,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  msg_type: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  is_read: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  createdAt: 'created_at'
});

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  avatar: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'admin'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  last_login_time: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, {
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const HomeConfig = sequelize.define('HomeConfig', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'home_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Return = sequelize.define('Return', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '订单ID'
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '用户ID'
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '退货原因'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '退货说明'
  },
  images: {
    type: DataTypes.TEXT,
    comment: '退货图片JSON'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '0-待处理 1-处理中 2-已完成 3-已拒绝'
  },
  admin_remark: {
    type: DataTypes.STRING(500),
    comment: '管理员备注'
  }
}, {
  tableName: 'returns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Product.hasMany(ProductSku, { foreignKey: 'product_id', as: 'skus' });
ProductSku.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

User.hasMany(Cart, { foreignKey: 'user_id', as: 'carts' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Product.hasMany(Cart, { foreignKey: 'product_id', as: 'cartItems' });
Cart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductSku.hasMany(Cart, { foreignKey: 'sku_id', as: 'cartItems' });
Cart.belongsTo(ProductSku, { foreignKey: 'sku_id', as: 'sku' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductSku.hasMany(OrderItem, { foreignKey: 'sku_id', as: 'orderItems' });
OrderItem.belongsTo(ProductSku, { foreignKey: 'sku_id', as: 'sku' });

Order.hasOne(Logistics, { foreignKey: 'order_id', as: 'logistics' });
Logistics.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Order.hasMany(Review, { foreignKey: 'order_id', as: 'reviews' });
Review.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 用户推荐关系
User.belongsTo(User, { foreignKey: 'referrer_id', as: 'referrer' });
User.hasMany(User, { foreignKey: 'referrer_id', as: 'referred' });

Session.hasMany(Message, { foreignKey: 'session_id', as: 'messages' });
Message.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'user', constraints: false });
Message.belongsTo(Admin, { foreignKey: 'sender_id', as: 'admin', constraints: false });

Order.hasMany(Return, { foreignKey: 'order_id', as: 'returns' });
Return.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
User.hasMany(Return, { foreignKey: 'user_id', as: 'returns' });
Return.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Address,
  Category,
  Product,
  ProductSku,
  Cart,
  Order,
  OrderItem,
  Logistics,
  Review,
  Session,
  Message,
  Admin,
  HomeConfig,
  Return
};
