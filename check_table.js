require('dotenv').config();
const { sequelize } = require('./models');

async function checkTable() {
  try {
    const result = await sequelize.query("SHOW TABLES LIKE 'returns'");
    console.log('Tables found:', result[0]);
    if (result[0].length > 0) {
      console.log('✅ 退货表已存在');
    } else {
      console.log('❌ 退货表不存在，正在创建...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`returns\` (
          \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          \`order_id\` INT UNSIGNED NOT NULL,
          \`user_id\` INT UNSIGNED NOT NULL,
          \`reason\` VARCHAR(500) NOT NULL,
          \`description\` TEXT,
          \`images\` TEXT,
          \`status\` TINYINT DEFAULT 0,
          \`admin_remark\` VARCHAR(500),
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_order_id\` (\`order_id\`),
          INDEX \`idx_user_id\` (\`user_id\`),
          INDEX \`idx_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('✅ 退货表创建成功');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTable();