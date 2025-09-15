const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 测试Coze V3 API
async function testCozeV3API() {
  try {
    console.log('开始测试Coze V3 API...');
    
    const PAT_TOKEN = process.env.COZE_PAT;
    const BOT_ID = process.env.COZE_BOT_ID;
    const USER_ID = 'test_user_123';
    
    if (!PAT_TOKEN || !BOT_ID) {
      throw new Error('缺少必要的环境变量配置');
    }
    
    console.log('配置信息:');
    console.log('- PAT Token:', PAT_TOKEN.substring(0, 20) + '...');
    console.log('- Bot ID:', BOT_ID);
    console.log('- User ID:', USER_ID);
    
    // 发送消息到Coze
    const requestData = {
      bot_id: BOT_ID,
      user_id: USER_ID,
      stream: false,
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: '你好，请介绍一下你自己',
          content_type: 'text'
        }
      ]
    };
    
    console.log('\n发送请求到Coze API...');
    const response = await axios.post(
      'https://api.coze.cn/v3/chat',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${PAT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\nCoze API响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 检查响应状态
    if (response.data.code !== 0) {
      throw new Error(`Coze API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const chatData = response.data.data;
    if (!chatData) {
      throw new Error('响应中缺少data字段');
    }
    
    const chatId = chatData.id;
    const conversationId = chatData.conversation_id;
    
    console.log('\n获取到的信息:');
    console.log('- Chat ID:', chatId);
    console.log('- Conversation ID:', conversationId);
    
    // 轮询获取消息结果
    console.log('\n开始轮询获取回答...');
    const messageUrl = `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`;
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      try {
        const messageResponse = await axios.get(messageUrl, {
          headers: {
            'Authorization': `Bearer ${PAT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`\n第${attempts + 1}次轮询结果:`);
        console.log(JSON.stringify(messageResponse.data, null, 2));
        
        if (messageResponse.data.code === 0 && messageResponse.data.data) {
          const messages = messageResponse.data.data;
          
          // 查找assistant的回答
          const answerMessage = messages.find(msg => 
            msg.role === 'assistant' && msg.type === 'answer'
          );
          
          if (answerMessage && answerMessage.content) {
            console.log('\n✅ 成功获取到回答:');
            console.log(answerMessage.content);
            return;
          }
        }
      } catch (pollError) {
        console.warn('轮询时出错:', pollError.message);
      }
      
      attempts++;
      console.log(`等待中... (${attempts}/${maxAttempts})`);
    }
    
    console.log('\n❌ 轮询超时，未能获取到回答');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testCozeV3API();