const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始生产环境构建...');

// 1. 清理之前的构建文件
console.log('📁 清理构建目录...');
if (fs.existsSync('./dist')) {
  execSync('rmdir /s /q dist', { stdio: 'inherit' });
}
if (fs.existsSync('./client/dist')) {
  execSync('rmdir /s /q client\\dist', { stdio: 'inherit' });
}

// 2. 安装依赖
console.log('📦 安装后端依赖...');
execSync('npm install', { stdio: 'inherit', cwd: './server' });

console.log('📦 安装前端依赖...');
execSync('npm install', { stdio: 'inherit', cwd: './client' });

// 3. 构建后端
console.log('🔨 构建后端...');
execSync('npm run build', { stdio: 'inherit', cwd: './server' });

// 4. 构建前端
console.log('🔨 构建前端...');
execSync('npm run build', { stdio: 'inherit', cwd: './client' });

// 5. 复制后端构建文件
console.log('📋 复制后端构建文件...');
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}
execSync('xcopy "server\\dist" "dist" /E /I /Y', { stdio: 'inherit' });

// 6. 复制配置文件
console.log('📋 复制配置文件...');
const productionFiles = [
  'server/package.json',
  'server/.env.production',
  'server/data',
  'server/uploads'
];

productionFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(__dirname, 'dist', path.basename(file));
  
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      execSync(`xcopy "${src}" "${dest}" /E /I /Y`, { stdio: 'inherit' });
    } else {
      if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      fs.copyFileSync(src, dest);
    }
  }
});

// 7. 复制前端构建文件到后端静态目录
console.log('📋 复制前端文件...');
const staticDir = path.join(__dirname, 'dist', 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}
execSync(`xcopy "client\\dist" "dist\\static" /E /I /Y`, { stdio: 'inherit' });

// 8. 在 dist 目录安装生产依赖
console.log('📦 安装生产依赖...');
execSync('npm install --production', { stdio: 'inherit', cwd: './dist' });

console.log('✅ 生产环境构建完成!');
console.log('📁 构建文件位于: ./dist');
console.log('🚀 可以使用以下命令启动生产服务器:');
console.log('   cd dist && node index.js');