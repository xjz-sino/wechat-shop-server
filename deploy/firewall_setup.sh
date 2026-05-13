#!/bin/bash
# 防火墙配置脚本

# 启动 FirewallD
systemctl start firewalld
systemctl enable firewalld

# 开放端口
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp

# 重载防火墙
firewall-cmd --reload

# 查看开放的端口
firewall-cmd --list-ports
