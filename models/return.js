module.exports = (sequelize, DataTypes) => {
  const Return = sequelize.define('Return', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '订单ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
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

  Return.associate = (models) => {
    Return.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });
    Return.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Return;
};
