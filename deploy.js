const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署到生产环境...');

// 检查必要的环境变量
const requiredEnvVars = [
  'COZE_BOT_ID',
  'COZE_OAUTH_CLIENT_ID', 
  'COZE_OAUTH_CLIENT_SECRET',
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL'
];

console.log('🔍 检查环境变量配置...');
const envFile = path.join(__dirname, 'server', '.env.production');
if (!fs.existsSync(envFile)) {
  console.error('❌ 未找到生产环境配置文件: server/.env.production');
  console.log('请先配置生产环境变量，参考 server/.env.example');
  process.exit(1);
}

// 读取环境变量文件
const envContent = fs.readFileSync(envFile, 'utf8');
const missingVars = requiredEnvVars.filter(varName => {
  const regex = new RegExp(`^${varName}=.+`, 'm');
  return !regex.test(envContent) || envContent.includes(`${varName}=your-`);
});

if (missingVars.length > 0) {
  console.error('❌ 以下环境变量未正确配置:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('请在 server/.env.production 中配置这些变量');
  process.exit(1);
}

console.log('✅ 环境变量检查通过');

// 运行构建脚本
console.log('🔨 开始构建...');
try {
  execSync('node build-production.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 创建启动脚本
console.log('📝 创建启动脚本...');
const startScript = `#!/bin/bash
# 生产环境启动脚本

# 设置环境变量
export NODE_ENV=production

# 启动应用
node index.js
`;

fs.writeFileSync(path.join(__dirname, 'dist', 'start.sh'), startScript);

// 创建PM2配置文件
const pm2Config = {
  apps: [{
    name: 'hospital-login-system',
    script: 'index.js',
    cwd: './dist',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

fs.writeFileSync(
  path.join(__dirname, 'dist', 'ecosystem.config.js'),
  `module.exports = ${JSON.stringify(pm2Config, null, 2)};`
);

// 创建nginx配置示例
const nginxConfig = `# Nginx配置示例
# 请根据实际情况修改域名和路径

server {
    listen 80;
    server_name yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 静态文件
    location / {
        root /path/to/your/dist/static;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 微信验证
    location /wechat/verify {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

fs.writeFileSync(path.join(__dirname, 'dist', 'nginx.conf.example'), nginxConfig);

// 创建部署说明
const deployGuide = `# 生产环境部署指南

## 1. 服务器要求
- Node.js 16+
- PM2 (进程管理)
- Nginx (反向代理)
- SSL证书

## 2. 部署步骤

### 2.1 上传文件
将 dist 目录上传到服务器

### 2.2 安装依赖
\`\`\`bash
cd dist
npm install --production
\`\`\`

### 2.3 配置环境变量
编辑 .env.production 文件，设置正确的生产环境变量

### 2.4 启动应用
\`\`\`bash
# 使用PM2启动
pm2 start ecosystem.config.js

# 或直接启动
NODE_ENV=production node index.js
\`\`\`

### 2.5 配置Nginx
1. 复制 nginx.conf.example 到 Nginx 配置目录
2. 修改域名和路径
3. 配置SSL证书
4. 重启Nginx

## 3. 微信公众号配置

### 3.1 设置服务器配置
在微信公众平台设置：
- URL: https://yourdomain.com/api/wechat/verify
- Token: 在环境变量中设置的WECHAT_TOKEN

### 3.2 设置网页授权域名
在微信公众平台设置网页授权域名：yourdomain.com

## 4. 监控和日志

### 4.1 PM2 监控
\`\`\`bash
pm2 status
pm2 logs
pm2 monit
\`\`\`

### 4.2 日志文件
- 错误日志: logs/err.log
- 输出日志: logs/out.log
- 合并日志: logs/combined.log

## 5. 备份和恢复

### 5.1 数据库备份
\`\`\`bash
cp data/database.sqlite data/database.sqlite.backup
\`\`\`

### 5.2 上传文件备份
\`\`\`bash
tar -czf uploads.tar.gz uploads/
\`\`\`
`;

fs.writeFileSync(path.join(__dirname, 'dist', 'DEPLOY.md'), deployGuide);

console.log('✅ 部署准备完成!');
console.log('');
console.log('📁 部署文件位于: ./dist');
console.log('📖 部署说明: ./dist/DEPLOY.md');
console.log('⚙️  Nginx配置: ./dist/nginx.conf.example');
console.log('🚀 PM2配置: ./dist/ecosystem.config.js');
console.log('');
console.log('🔧 下一步:');
console.log('1. 配置生产环境变量 (server/.env.production)');
console.log('2. 上传 dist 目录到服务器');
console.log('3. 按照 DEPLOY.md 说明完成部署');
console.log('4. 在微信公众平台配置服务器URL和授权域名');