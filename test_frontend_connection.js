const axios = require('axios');

async function testFrontendConnection() {
  console.log('测试前端到后端的连接...');
  
  try {
    // 测试管理员登录
    console.log('\n1. 测试管理员登录:');
    const adminLoginResponse = await axios.post('http://localhost:5000/api/auth/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('管理员登录成功!');
    console.log('响应状态:', adminLoginResponse.status);
    console.log('响应数据:', adminLoginResponse.data);
    
    // 测试获取配对数据
    console.log('\n2. 测试获取配对数据:');
    const token = adminLoginResponse.data.token;
    const pairsResponse = await axios.get('http://localhost:5000/api/admin/pairs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取配对数据成功!');
    console.log('响应状态:', pairsResponse.status);
    console.log('配对数据数量:', pairsResponse.data.data.length);
    
  } catch (error) {
    console.error('连接测试失败:');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求失败:', error.message);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testFrontendConnection();