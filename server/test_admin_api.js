const axios = require('axios');

async function testAdminLogin() {
  console.log('测试管理员登录API...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('登录成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    console.log('响应头:', response.headers);
    
  } catch (error) {
    console.error('登录失败!');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
      console.error('响应头:', error.response.headers);
    } else if (error.request) {
      console.error('请求错误:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    console.error('完整错误:', error);
  }
}

testAdminLogin();