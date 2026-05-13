-- MySQL 初始化脚本
-- 在 mysql> 提示符下执行

-- 修改 root 密码
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'XingMeng2024!@#';

-- 创建数据库
CREATE DATABASE wechat_shop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用用户
CREATE USER 'shop_user'@'%' IDENTIFIED WITH mysql_native_password BY 'XingMeng2024!@#';

-- 授权
GRANT ALL PRIVILEGES ON wechat_shop.* TO 'shop_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出
EXIT;
