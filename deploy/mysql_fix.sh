#!/bin/bash
# MySQL 安装修复脚本

# 检查是否已安装
rpm -qa | grep mysql

# 如果未安装，使用阿里云镜像安装
echo "=== 使用阿里云镜像安装 MySQL ==="
cat > /etc/yum.repos.d/mysql-community.repo << 'EOF'
[mysql80-community]
name=MySQL 8.0 Community Server
baseurl=https://mirrors.aliyun.com/mysql/MySQL-8.0/AlibabaCloudLinux/
gpgcheck=0
enabled=1
EOF

# 安装 MySQL
yum install -y mysql-community-server

# 启动 MySQL
systemctl start mysqld
systemctl enable mysqld

# 检查状态
systemctl status mysqld --no-pager

# 查找密码
echo "=== 查找临时密码 ==="
grep 'temporary password' /var/log/mysqld.log 2>/dev/null || echo "日志文件不存在"

# 尝试登录
echo "=== 测试 MySQL ==="
which mysql
mysql --version
