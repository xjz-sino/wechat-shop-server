#!/bin/bash
# Alibaba Cloud Linux 3 安装 MySQL 8.0

# 删除错误的源
rm -f /etc/yum.repos.d/mysql-community.repo

# 使用官方源安装
cat > /etc/yum.repos.d/mysql-community.repo << 'EOF'
[mysql80-community]
name=MySQL 8.0 Community Server
baseurl=https://repo.mysql.com/yum/mysql-8.0-community/el/8/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://repo.mysql.com/RPM-GPG-KEY-mysql-2023
EOF

# 安装 MySQL
yum install -y mysql-community-server

# 启动
systemctl start mysqld
systemctl enable mysqld

# 检查状态
systemctl status mysqld --no-pager

# 查找密码
echo "=== MySQL 临时密码 ==="
grep 'temporary password' /var/log/mysqld.log
