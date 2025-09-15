const path = require('path');
const fs = require('fs');

console.log('=== 生产环境问题诊断（简化版）===\n');

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
        // 读取文件内容的前几行
        try {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n').slice(0, 5);
            console.log(`      前5行内容:`);
            lines.forEach((line, i) => {
                if (line.trim()) console.log(`        ${i + 1}: ${line}`);
            });
        } catch (err) {
            console.log(`      读取失败: ${err.message}`);
        }
    }
});

// 3. 模拟 dist/index.js 的环境变量加载逻辑
console.log('\n4. 模拟 dist/index.js 的环境变量加载:');
const originalCwd = process.cwd();
const distDir = path.resolve(__dirname, 'dist');

console.log(`   原始工作目录: ${originalCwd}`);
console.log(`   dist 目录: ${distDir}`);
console.log(`   dist 目录存在: ${fs.existsSync(distDir)}`);

// 切换到 dist 目录（模拟在 dist 目录运行 node index.js）
if (fs.existsSync(distDir)) {
    process.chdir(distDir);
    console.log(`   切换后工作目录: ${process.cwd()}`);
    
    // 检查当前 NODE_ENV
    console.log(`   当前 NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
    
    // 模拟原始代码的环境变量加载逻辑
    const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
    const envPath = path.resolve(process.cwd(), `../${envFile}`);
    
    console.log(`   环境文件名: ${envFile}`);
    console.log(`   原始加载路径: ${envPath}`);
    console.log(`   原始路径文件存在: ${fs.existsSync(envPath)}`);
    
    // 修正后的路径
    const correctedEnvPath = path.resolve(process.cwd(), envFile);
    console.log(`   修正后路径: ${correctedEnvPath}`);
    console.log(`   修正路径文件存在: ${fs.existsSync(correctedEnvPath)}`);
    
    // 手动设置 NODE_ENV=production 测试
    console.log('\n5. 手动设置 NODE_ENV=production:');
    process.env.NODE_ENV = 'production';
    const prodEnvFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
    const prodEnvPath = path.resolve(process.cwd(), prodEnvFile);
    console.log(`   生产环境文件: ${prodEnvFile}`);
    console.log(`   生产环境路径: ${prodEnvPath}`);
    console.log(`   生产环境文件存在: ${fs.existsSync(prodEnvPath)}`);
    
    // 检查静态文件
    console.log('\n6. 检查静态文件:');
    const staticDir = path.resolve(process.cwd(), 'static');
    const indexFile = path.resolve(staticDir, 'index.html');
    console.log(`   静态目录: ${staticDir}`);
    console.log(`   静态目录存在: ${fs.existsSync(staticDir)}`);
    console.log(`   index.html: ${indexFile}`);
    console.log(`   index.html存在: ${fs.existsSync(indexFile)}`);
    
    if (fs.existsSync(staticDir)) {
        try {
            const files = fs.readdirSync(staticDir);
            console.log(`   静态文件列表: ${files.join(', ')}`);
        } catch (err) {
            console.log(`   读取静态目录失败: ${err.message}`);
        }
    }
    
    // 恢复原始工作目录
    process.chdir(originalCwd);
}

console.log('\n7. 问题分析:');
console.log('   如果 "原始路径文件存在" 为 false，说明环境变量加载路径错误');
console.log('   如果 "修正路径文件存在" 为 true，说明需要修改源代码中的路径');
console.log('   如果 "index.html存在" 为 false，说明前端文件没有正确部署');

console.log('\n=== 诊断完成 ===');