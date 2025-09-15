const axios = require('axios');
require('dotenv').config();

// 测试Coze配置
async function testCozeConfig() {
  const cozeApiKey = process.env.COZE_PAT;
  const cozeBotId = process.env.COZE_BOT_ID;
  
  console.log('=== Coze配置测试 ===');
  console.log('COZE_PAT:', cozeApiKey ? `${cozeApiKey.substring(0, 10)}...` : '未设置');
  console.log('COZE_BOT_ID:', cozeBotId);
  
  if (!cozeApiKey) {
    console.error('❌ COZE_PAT未设置');
    return;
  }
  
  if (!cozeBotId || cozeBotId === 'your_coze_bot_id_here') {
    console.error('❌ COZE_BOT_ID未正确设置');
    console.log('\n📝 如何获取Bot ID:');
    console.log('1. 访问 https://www.coze.cn/');
    console.log('2. 登录并进入你的工作空间');
    console.log('3. 选择或创建一个Bot');
    console.log('4. 在Bot页面的URL中，bot/后面的数字就是Bot ID');
    console.log('   例如: https://www.coze.cn/space/xxx/bot/123456789');
    console.log('   Bot ID就是: 123456789');
    return;
  }
  
  // 测试API连接
  console.log('\n=== 测试API连接 ===');
  
  try {
    // 尝试创建会话
    const createConversationData = {
      bot_id: cozeBotId,
      meta_data: {
        app_user_id: 'test_user_123'
      }
    };
    
    console.log('正在测试创建会话...');
    const response = await axios.post(
      'https://api.coze.com/v1/conversation/create',
      createConversationData,
      {
        headers: {
          'Authorization': `Bearer ${cozeApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 会话创建成功!');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    const conversationId = response.data.id || (response.data.conversation && response.data.conversation.id);
    
    if (conversationId) {
      console.log('✅ 会话ID获取成功:', conversationId);
      
      // 测试发送消息
      console.log('\n正在测试发送消息...');
      const sendMessageData = {
        bot_id: cozeBotId,
        user_id: 'test_user_123',
        stream: false,
        additional_messages: [
          {
            role: 'user',
            type: 'question',
            content_type: 'text',
            content: '你好，这是一个测试消息'
          }
        ]
      };
      
      const chatResponse = await axios.post(
        `https://api.coze.com/v3/chat?conversation_id=${conversationId}`,
        sendMessageData,
        {
          headers: {
            'Authorization': `Bearer ${cozeApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ 消息发送成功!');
      console.log('响应数据:', JSON.stringify(chatResponse.data, null, 2));
      
      let answer = chatResponse.data.answer;
      if (!answer && chatResponse.data.messages) {
        const answerMessage = chatResponse.data.messages.find(msg => msg.role === 'assistant' && msg.type === 'answer');
        if (answerMessage) {
          answer = answerMessage.content;
        }
      }
      
      if (answer) {
        console.log('✅ AI回复:', answer);
      } else {
        console.log('⚠️ 未能获取到AI回复');
      }
    } else {
      console.log('❌ 无法获取会话ID');
    }
    
  } catch (error) {
    console.error('❌ API调用失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n💡 可能的解决方案:');
        console.log('1. 检查COZE_PAT是否正确');
        console.log('2. 确认PAT是否已过期');
        console.log('3. 验证PAT是否有足够的权限');
      } else if (error.response.status === 404) {
        console.log('\n💡 可能的解决方案:');
        console.log('1. 检查COZE_BOT_ID是否正确');
        console.log('2. 确认Bot是否已发布');
        console.log('3. 验证Bot是否在当前工作空间中');
      }
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

testCozeConfig().catch(console.error);