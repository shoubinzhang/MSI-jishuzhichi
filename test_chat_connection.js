const axios = require('axios');

// 测试聊天API连接
async function testChatConnection() {
  console.log('🔍 测试聊天API连接...');
  
  try {
    // 1. 先测试普通用户登录
    console.log('\n1. 测试普通用户登录:');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      hospital_name: '安徽省立医院',
      product_batch: '0000530742'
    });
    
    console.log('用户登录成功!');
    console.log('响应状态:', loginResponse.status);
    console.log('响应数据结构:');
    console.log('- ok:', loginResponse.data.ok);
    console.log('- tokens存在:', !!loginResponse.data.tokens);
    if (loginResponse.data.tokens) {
      console.log('- accessToken存在:', !!loginResponse.data.tokens.accessToken);
      console.log('- refreshToken存在:', !!loginResponse.data.tokens.refreshToken);
      console.log('- expiresIn:', loginResponse.data.tokens.expiresIn);
    }
    
    const accessToken = loginResponse.data.tokens?.accessToken;
    console.log('提取的accessToken长度:', accessToken ? accessToken.length : 0);
    
    // 2. 测试聊天API
    console.log('\n2. 测试聊天API:');
    const chatResponse = await axios.post('http://localhost:5000/api/chat/send', {
      message: '你好，这是一个测试消息'
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('聊天API调用成功!');
    console.log('响应状态:', chatResponse.status);
    console.log('响应数据:', JSON.stringify(chatResponse.data, null, 2));
    
  } catch (error) {
    console.error('聊天连接测试失败:');
    console.error('错误状态:', error.response?.status);
    console.error('错误数据:', error.response?.data);
    console.error('错误详情:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 检查认证问题...');
      
      // 检查token格式
      if (error.config?.headers?.Authorization) {
        const token = error.config.headers.Authorization.replace('Bearer ', '');
        console.log('Token长度:', token.length);
        console.log('Token前50字符:', token.substring(0, 50));
        
        // 尝试解析JWT payload
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          console.log('JWT Payload:', JSON.stringify(payload, null, 2));
        } catch (jwtError) {
          console.log('JWT解析失败:', jwtError.message);
        }
      }
    }
  }
}

// 运行测试
testChatConnection();