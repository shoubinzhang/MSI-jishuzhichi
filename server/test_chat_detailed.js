const axios = require('axios');

async function testChatDetailed() {
  try {
    console.log('=== 开始详细测试聊天API ===');
    
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      hospital_name: '上海市第一人民医院',
      product_batch: '0000530742'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data.tokens?.accessToken) {
      throw new Error('登录失败，未获取到accessToken');
    }
    
    console.log('✅ 登录成功，token长度:', loginResponse.data.tokens.accessToken.length);
    
    // 2. 发送聊天消息
    console.log('\n2. 发送聊天消息...');
    console.log('请求URL: http://localhost:5000/api/chat/send');
    console.log('请求头: Authorization: Bearer [token]');
    console.log('请求体: { "message": "你好" }');
    
    const startTime = Date.now();
    
    const chatResponse = await axios.post(
      'http://localhost:5000/api/chat/send',
      { message: '你好' },
      {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n=== 聊天API响应 ===');
    console.log('响应状态:', chatResponse.status);
    console.log('响应时间:', duration + 'ms');
    console.log('响应头:', JSON.stringify(chatResponse.headers, null, 2));
    console.log('响应数据:', JSON.stringify(chatResponse.data, null, 2));
    
    if (chatResponse.data.answer) {
      console.log('\n✅ 聊天成功！机器人回复:', chatResponse.data.answer);
    } else {
      console.log('\n❌ 聊天失败，没有获取到回复');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    if (axios.isAxiosError(error)) {
      console.error('错误类型: Axios错误');
      console.error('错误状态:', error.response?.status);
      console.error('错误头:', error.response?.headers);
      console.error('错误数据:', error.response?.data);
      console.error('请求配置:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    } else {
      console.error('错误类型: 其他错误');
      console.error('错误堆栈:', error.stack);
    }
  }
}

testChatDetailed();