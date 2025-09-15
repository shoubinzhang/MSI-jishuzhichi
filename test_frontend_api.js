const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('=== 测试前端API连接 ===');
    
    // 1. 测试登录
    console.log('1. 测试登录API...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
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
    
    console.log('✅ 登录成功');
    
    // 2. 测试聊天API
    console.log('\n2. 测试聊天API...');
    const chatResponse = await axios.post(
      'http://localhost:5173/api/chat/send',
      { message: '你好，这是一个测试消息' },
      {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('聊天响应状态:', chatResponse.status);
    console.log('聊天响应数据:', JSON.stringify(chatResponse.data, null, 2));
    
    if (chatResponse.data.answer) {
      console.log('\n✅ 聊天API测试成功！');
      console.log('机器人回复:', chatResponse.data.answer);
    } else {
      console.log('\n❌ 聊天API测试失败，没有获取到回复');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    if (axios.isAxiosError(error)) {
      console.error('错误类型: Axios错误');
      console.error('错误状态:', error.response?.status);
      console.error('错误数据:', error.response?.data);
      console.error('请求URL:', error.config?.url);
      console.error('请求方法:', error.config?.method);
      
      if (error.code) {
        console.error('错误代码:', error.code);
      }
    } else {
      console.error('错误类型: 其他错误');
      console.error('错误堆栈:', error.stack);
    }
  }
}

testFrontendAPI();