const axios = require('axios');

async function testSimple() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      hospital_name: '上海市第一人民医院',
      product_batch: '0000530742'
    });
    
    console.log('响应状态:', response.status);
    console.log('响应数据keys:', Object.keys(response.data));
    
    if (response.data.accessToken) {
      console.log('✅ accessToken存在，长度:', response.data.accessToken.length);
      
      // 测试聊天API
      const chatResponse = await axios.post(
        'http://localhost:5000/api/chat/send',
        { message: '你好' },
        {
          headers: {
            'Authorization': `Bearer ${response.data.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      
      console.log('聊天响应状态:', chatResponse.status);
      console.log('聊天响应:', chatResponse.data);
      
    } else {
      console.log('❌ accessToken不存在');
      console.log('响应数据:', response.data);
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
  }
}

testSimple();