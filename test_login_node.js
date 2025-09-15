const axios = require('axios');

// 测试登录API
async function testLogin() {
  try {
    console.log('测试中文字符传输...');
    
    const loginData = {
      hospital_name: '安徽省立医院',
      product_batch: '0000530742'
    };
    
    console.log('发送的数据:', loginData);
    console.log('hospital_name字节:', Buffer.from(loginData.hospital_name, 'utf8'));
    console.log('product_batch字节:', Buffer.from(loginData.product_batch, 'utf8'));
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    console.log('响应:', response.data);
  } catch (error) {
    console.log('错误:', error.response?.data || error.message);
  }
}

testLogin();