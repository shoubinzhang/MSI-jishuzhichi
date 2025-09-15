const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testCozeAPI() {
  try {
    console.log('开始测试COZE API...');
    console.log('COZE_PAT:', process.env.COZE_PAT ? '已配置' : '未配置');
    console.log('COZE_BOT_ID:', process.env.COZE_BOT_ID);
    
    const authToken = process.env.COZE_PAT;
    const cozeBotId = process.env.COZE_BOT_ID;
    
    if (!authToken) {
      throw new Error('缺少COZE_PAT配置');
    }
    
    if (!cozeBotId) {
      throw new Error('缺少COZE_BOT_ID配置');
    }
    
    // 测试请求数据
    const requestData = {
      bot_id: cozeBotId,
      user_id: 'test_user_123',
      stream: false,
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: '你好，请介绍一下自己',
          content_type: 'text'
        }
      ]
    };
    
    console.log('发送请求到COZE API...');
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(
      'https://api.coze.cn/v3/chat',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('COZE API响应状态:', response.status);
    console.log('COZE API响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code !== 0) {
      throw new Error(`COZE API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const chatData = response.data.data;
    if (!chatData) {
      throw new Error('COZE API响应中缺少data字段');
    }
    
    const chatId = chatData.id;
    const conversationId = chatData.conversation_id;
    
    console.log('Chat ID:', chatId);
    console.log('Conversation ID:', conversationId);
    
    // 等待一段时间后查询结果
    console.log('等待3秒后查询结果...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const retrieveUrl = `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`;
    
    const retrieveResponse = await axios.get(retrieveUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('查询响应:', JSON.stringify(retrieveResponse.data, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('错误详情:', error.response?.data);
      console.error('错误状态:', error.response?.status);
    }
  }
}

testCozeAPI();