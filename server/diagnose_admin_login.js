const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function diagnoseAdminLogin() {
  console.log('=== 管理员登录诊断 ===\n');
  
  // 1. 检查数据库中的管理员账户
  console.log('1. 检查数据库中的管理员账户...');
  
  const admin = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM admin_users WHERE username = ?', ['admin'], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!admin) {
    console.log('❌ 未找到管理员账户');
    db.close();
    return;
  }
  
  console.log('✅ 找到管理员账户:');
  console.log(`   用户名: ${admin.username}`);
  console.log(`   密码哈希: ${admin.password_hash}`);
  
  // 2. 测试密码验证
  console.log('\n2. 测试密码验证...');
  const testPassword = 'admin123';
  const isPasswordValid = bcrypt.compareSync(testPassword, admin.password_hash);
  
  if (isPasswordValid) {
    console.log('✅ 密码验证成功');
  } else {
    console.log('❌ 密码验证失败');
    db.close();
    return;
  }
  
  // 3. 测试后端API
  console.log('\n3. 测试后端API...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 5000
    });
    
    console.log('✅ 后端API响应成功');
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应数据: ${JSON.stringify(response.data)}`);
    
    // 检查session cookie
    const cookies = response.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      console.log('✅ 设置了session cookie');
      cookies.forEach(cookie => {
        console.log(`   ${cookie}`);
      });
    } else {
      console.log('⚠️  未设置session cookie');
    }
    
  } catch (error) {
    console.log('❌ 后端API请求失败');
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('   网络错误或服务器无响应');
      console.log(`   错误: ${error.message}`);
    } else {
      console.log(`   请求配置错误: ${error.message}`);
    }
    db.close();
    return;
  }
  
  // 4. 检查前端服务器状态
  console.log('\n4. 检查前端服务器状态...');
  
  try {
    const frontendResponse = await axios.get('http://localhost:5174/admin/login', {
      timeout: 5000
    });
    
    console.log('✅ 前端服务器响应正常');
    console.log(`   状态码: ${frontendResponse.status}`);
    
  } catch (error) {
    console.log('❌ 前端服务器无响应');
    console.log(`   错误: ${error.message}`);
  }
  
  // 5. 测试完整的登录流程
  console.log('\n5. 测试完整的登录流程...');
  
  try {
    // 创建一个带cookie的axios实例
    const cookieJar = [];
    const apiClient = axios.create({
      baseURL: 'http://localhost:5000/api',
      withCredentials: true,
      timeout: 5000
    });
    
    // 拦截响应以保存cookie
    apiClient.interceptors.response.use(response => {
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        cookieJar.push(...cookies);
      }
      return response;
    });
    
    // 拦截请求以发送cookie
    apiClient.interceptors.request.use(config => {
      if (cookieJar.length > 0) {
        config.headers.Cookie = cookieJar.join('; ');
      }
      return config;
    });
    
    // 执行登录
    const loginResponse = await apiClient.post('/auth/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ 登录请求成功');
    
    // 测试需要认证的接口
    const pairsResponse = await apiClient.get('/admin/pairs');
    
    console.log('✅ 认证后的API访问成功');
    console.log(`   获取到 ${pairsResponse.data.data.length} 条白名单记录`);
    
  } catch (error) {
    console.log('❌ 完整登录流程测试失败');
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   错误: ${error.message}`);
    }
  }
  
  console.log('\n=== 诊断完成 ===');
  db.close();
}

diagnoseAdminLogin().catch(console.error);