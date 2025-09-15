# 生产环境部署指南

本指南将帮助您将医院登录系统部署到生产环境并集成微信公众号。

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+)
- **Node.js**: 16.x 或更高版本
- **内存**: 最少 2GB RAM
- **存储**: 最少 10GB 可用空间
- **网络**: 公网IP和域名

### 2. 必需的服务
- **Nginx**: 反向代理和静态文件服务
- **PM2**: Node.js 进程管理
- **SSL证书**: HTTPS支持 (Let's Encrypt 推荐)

### 3. 微信公众号要求
- 已认证的微信公众号
- 网页授权功能已开通
- 服务器配置权限

## 🔧 配置步骤

### 步骤 1: 配置生产环境变量

编辑 `server/.env.production` 文件：

```bash
# 基础配置
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# 域名配置 (重要: 替换为您的实际域名)
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Coze API配置
COZE_API_BASE=https://api.coze.cn
COZE_BOT_ID=your-bot-id
COZE_USER_ID=your-user-id
COZE_OAUTH_CLIENT_ID=your-oauth-client-id
COZE_OAUTH_CLIENT_SECRET=your-oauth-client-secret

# 微信公众号配置 (重要: 从微信公众平台获取)
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_TOKEN=your-wechat-token

# 安全配置
BCRYPT_ROUNDS=12
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

编辑 `client/.env.production` 文件：

```bash
# 前端生产环境配置 (重要: 替换为您的实际域名)
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_WECHAT_APP_ID=your-wechat-app-id
VITE_FRONTEND_URL=https://yourdomain.com
```

### 步骤 2: 构建生产版本

```bash
# 运行部署脚本
npm run deploy
```

这将：
- 检查环境变量配置
- 构建前端和后端代码
- 生成部署文件到 `dist` 目录
- 创建 PM2 和 Nginx 配置文件

### 步骤 3: 上传到服务器

将 `dist` 目录上传到服务器：

```bash
# 使用 scp 上传
scp -r dist/ user@your-server:/var/www/hospital-login-system/

# 或使用 rsync
rsync -avz dist/ user@your-server:/var/www/hospital-login-system/
```

### 步骤 4: 服务器配置

#### 4.1 安装依赖

```bash
# 登录服务器
ssh user@your-server

# 进入应用目录
cd /var/www/hospital-login-system

# 安装生产依赖
npm install --production

# 安装 PM2 (如果未安装)
npm install -g pm2
```

#### 4.2 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 设置 PM2 开机自启
pm2 startup
pm2 save
```

#### 4.3 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx.conf.example /etc/nginx/sites-available/hospital-login-system

# 编辑配置文件，替换域名和路径
sudo nano /etc/nginx/sites-available/hospital-login-system

# 启用站点
sudo ln -s /etc/nginx/sites-available/hospital-login-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 4.4 配置 SSL 证书

使用 Let's Encrypt：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔗 微信公众号配置

### 步骤 1: 设置服务器配置

1. 登录微信公众平台 (mp.weixin.qq.com)
2. 进入「开发」->「基本配置」
3. 设置服务器配置：
   - **URL**: `https://yourdomain.com/api/wechat/verify`
   - **Token**: 与 `.env.production` 中的 `WECHAT_TOKEN` 一致
   - **EncodingAESKey**: 随机生成
   - **消息加解密方式**: 明文模式

### 步骤 2: 设置网页授权域名

1. 进入「设置与开发」->「公众号设置」->「功能设置」
2. 设置「网页授权域名」为：`yourdomain.com`
3. 下载验证文件并上传到网站根目录

### 步骤 3: 获取 AppID 和 AppSecret

1. 在「开发」->「基本配置」中获取：
   - **AppID**: 复制到环境变量 `WECHAT_APP_ID`
   - **AppSecret**: 复制到环境变量 `WECHAT_APP_SECRET`

## 🚀 验证部署

### 1. 检查服务状态

```bash
# 检查 PM2 状态
pm2 status

# 查看日志
pm2 logs

# 检查 Nginx 状态
sudo systemctl status nginx
```

### 2. 测试功能

1. **访问网站**: `https://yourdomain.com`
2. **测试管理员登录**: `https://yourdomain.com/admin/login`
3. **测试微信授权**: 在微信中打开网站链接
4. **测试API**: `https://yourdomain.com/api`

### 3. 微信公众号测试

1. 在微信公众平台测试服务器配置
2. 发送测试消息验证接口
3. 测试网页授权流程

## 📊 监控和维护

### 日志管理

```bash
# 查看应用日志
pm2 logs hospital-login-system

# 查看错误日志
tail -f logs/err.log

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 性能监控

```bash
# PM2 监控面板
pm2 monit

# 系统资源监控
htop
```

### 备份策略

```bash
# 数据库备份
cp data/database.sqlite data/database.sqlite.$(date +%Y%m%d_%H%M%S)

# 上传文件备份
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🔒 安全建议

1. **定期更新**: 保持系统和依赖包更新
2. **防火墙**: 只开放必要端口 (80, 443, 22)
3. **SSL配置**: 使用强加密算法
4. **密钥管理**: 定期更换密钥和token
5. **访问控制**: 限制管理员访问IP
6. **日志审计**: 定期检查访问日志

## 🆘 故障排除

### 常见问题

1. **应用无法启动**
   - 检查环境变量配置
   - 查看 PM2 日志
   - 确认端口未被占用

2. **微信授权失败**
   - 检查域名配置
   - 验证 AppID 和 AppSecret
   - 确认网页授权域名设置

3. **SSL证书问题**
   - 检查证书有效期
   - 验证域名解析
   - 重新生成证书

4. **数据库错误**
   - 检查文件权限
   - 验证数据库文件完整性
   - 恢复备份数据

### 联系支持

如遇到部署问题，请提供：
- 错误日志
- 系统环境信息
- 配置文件（隐藏敏感信息）

---

**注意**: 请确保在生产环境中使用强密码和安全的密钥，定期备份数据，并保持系统更新。