const https = require('https');
const http = require('http');

console.log('=== 管理员API测试 ===\n');

// 测试数据
const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

// HTTP请求选项
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

console.log('发送请求到:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('请求数据:', loginData);
console.log('');

// 发送请求
const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头:`, res.headers);
    console.log('');
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('响应内容:', data);
        
        try {
            const response = JSON.parse(data);
            if (response.accessToken || response.token) {
                console.log('\n✅ 管理员登录成功!');
                console.log('Token:', (response.accessToken || response.token).substring(0, 20) + '...');
            } else {
                console.log('\n❌ 登录失败:', response.message || '未知错误');
            }
        } catch (parseError) {
            console.log('\n⚠ 响应解析失败:', parseError.message);
            console.log('原始响应:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ 请求错误:', error.message);
});

// 发送数据
req.write(loginData);
req.end();