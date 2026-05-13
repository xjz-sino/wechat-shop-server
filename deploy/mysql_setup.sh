#!/bin/bash
# MySQL 安装和配置脚本

# 查找 MySQL 临时密码
echo "=== 查找 MySQL 临时密码 ==="
sudo grep 'temporary password' /var/log/mysql/*.log 2>/dev/null || \
sudo grep 'temporary password' /var/lib/mysql/*.err 2>/dev/null || \
sudo grep 'password' /var/log/mysqld.log 2>/dev/null || \
echo "未找到临时密码，尝试无密码登录"

# 检查 MySQL 状态
echo "=== MySQL 状态 ==="
systemctl status mysqld --no-pager

# 尝试获取临时密码的其他方法
echo "=== 尝试其他方法获取密码 ==="
sudo mysql -e "SELECT 1" 2>/dev/null && echo "MySQL 无需密码即可登录" || echo "需要密码"
