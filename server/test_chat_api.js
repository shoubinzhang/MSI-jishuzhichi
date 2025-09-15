const axios = require('axios');

async function testChatAPI() {
  try {
    console.log('测试聊天API...');
    
    // 首先登录获取token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      hospital_name: '上海市第一人民医院',
      product_batch: '0000530742'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录成功，获取token...');
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    console.log('响应状态:', loginResponse.status);
    console.log('响应数据类型:', typeof loginResponse.data);
    console.log('accessToken存在:', !!loginResponse.data.accessToken);
    const token = loginResponse.data.accessToken;
    
    if (!token) {
      console.log('Token值:', token);
      throw new Error('未获取到token');
    }
    
    console.log('Token获取成功，发送聊天消息...');
    
    // 发送聊天消息
    const chatResponse = await axios.post(
      'http://localhost:5000/api/chat/send',
      {
        message: '你好，请介绍一下MSI产品'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60秒超时
      }
    );
    
    console.log('聊天API响应状态:', chatResponse.status);
    console.log('聊天API响应数据:', JSON.stringify(chatResponse.data, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('完整错误:', error);
    if (axios.isAxiosError(error)) {
      console.error('错误状态:', error.response?.status);
      console.error('错误详情:', error.response?.data);
      console.error('错误配置:', error.config?.url);
    }
  }
}

testChatAPI();