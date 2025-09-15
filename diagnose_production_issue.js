const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

console.log('=== 生产环境问题诊断 ===\n');

// 1. 检查当前工作目录
console.log('1. 当前工作目录:', process.cwd());
console.log('2. __dirname:', __dirname);

// 2. 检查环境变量文件是否存在
const envFiles = [
    path.resolve(__dirname, 'dist/.env.production'),
    path.resolve(__dirname, '.env.production'),
    path.resolve(__dirname, 'dist/../.env.production')
];

console.log('\n3. 检查环境变量文件:');
envFiles.forEach((file, index) => {
    const exists = fs.existsSync(file);
    console.log(`   ${index + 1}. ${file} - ${exists ? '存在' : '不存在'}`);
    if (exists) {
        console.log(`      文件大小: ${fs.statSync(file).size} bytes`);
    }
});

// 3. 尝试加载环境变量（模拟 dist/index.js 的加载方式）
console.log('\n4. 尝试加载环境变量:');
const distDir = path.resolve(__dirname, 'dist');
process.chdir(distDir); // 切换到 dist 目录
console.log('   切换到目录:', process.cwd());

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath1 = path.resolve(process.cwd(), `../${envFile}`);
const envPath2 = path.resolve(process.cwd(), envFile);

console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   环境文件名: ${envFile}`);
console.log(`   路径1 (原逻辑): ${envPath1} - ${fs.existsSync(envPath1) ? '存在' : '不存在'}`);
console.log(`   路径2 (修正后): ${envPath2} - ${fs.existsSync(envPath2) ? '存在' : '不存在'}`);

// 4. 手动设置 NODE_ENV 并重新测试
process.env.NODE_ENV = 'production';
console.log('\n5. 手动设置 NODE_ENV=production 后:');
const envFile2 = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath3 = path.resolve(process.cwd(), envFile2);
console.log(`   环境文件名: ${envFile2}`);
console.log(`   环境文件路径: ${envPath3} - ${fs.existsSync(envPath3) ? '存在' : '不存在'}`);

// 5. 尝试加载环境变量
if (fs.existsSync(envPath3)) {
    console.log('\n6. 加载环境变量:');
    dotenv.config({ path: envPath3 });
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   COZE_BOT_ID: ${process.env.COZE_BOT_ID}`);
}

// 6. 检查静态文件目录
console.log('\n7. 检查静态文件:');
const staticDir = path.resolve(process.cwd(), 'static');
const indexFile = path.resolve(staticDir, 'index.html');
console.log(`   静态目录: ${staticDir} - ${fs.existsSync(staticDir) ? '存在' : '不存在'}`);
console.log(`   index.html: ${indexFile} - ${fs.existsSync(indexFile) ? '存在' : '不存在'}`);

if (fs.existsSync(staticDir)) {
    const files = fs.readdirSync(staticDir);
    console.log(`   静态文件列表: ${files.join(', ')}`);
}

// 7. 测试 Express 静态文件服务
console.log('\n8. 测试 Express 静态文件服务:');
const app = express();

if (process.env.NODE_ENV === 'production') {
    console.log('   生产环境模式 - 启用静态文件服务');
    app.use(express.static(path.resolve(process.cwd(), 'static')));
    
    app.get('*', (req, res) => {
        const indexPath = path.resolve(process.cwd(), 'static/index.html');
        console.log(`   SPA路由处理: ${req.path} -> ${indexPath}`);
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('index.html not found');
        }
    });
} else {
    console.log('   开发环境模式 - 未启用静态文件服务');
    app.get('/', (req, res) => {
        res.json({ message: '开发环境 - 无静态文件服务' });
    });
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`\n9. 测试服务器启动在: http://localhost:${PORT}`);
    console.log('   请在浏览器中访问测试');
    console.log('\n=== 诊断完成 ===');
});