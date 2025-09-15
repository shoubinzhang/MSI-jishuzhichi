const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testCozeComplete() {
  try {
    console.log('开始完整测试COZE API...');
    
    const authToken = process.env.COZE_PAT;
    const cozeBotId = process.env.COZE_BOT_ID;
    
    // 发送消息
    const requestData = {
      bot_id: cozeBotId,
      user_id: 'test_user_456',
      stream: false,
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: '你好',
          content_type: 'text'
        }
      ]
    };
    
    console.log('发送消息...');
    const response = await axios.post(
      'https://api.coze.cn/v3/chat',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const chatData = response.data.data;
    const chatId = chatData.id;
    const conversationId = chatData.conversation_id;
    
    console.log('Chat ID:', chatId);
    console.log('Conversation ID:', conversationId);
    
    // 轮询等待完成
    const retrieveUrl = `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`;
    
    let attempts = 0;
    const maxAttempts = 15;
    let delay = 1000;
    
    while (attempts < maxAttempts) {
      console.log(`轮询第 ${attempts + 1} 次，延迟 ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const retrieveResponse = await axios.get(retrieveUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const status = retrieveResponse.data.data.status;
        console.log(`状态: ${status}`);
        
        if (status === 'completed') {
          console.log('对话完成，获取消息列表...');
          
          const messageUrl = `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`;
          
          const messageResponse = await axios.get(messageUrl, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('消息列表响应:', JSON.stringify(messageResponse.data, null, 2));
          
          if (messageResponse.data.code === 0 && messageResponse.data.data) {
            const messages = messageResponse.data.data;
            const botReply = messages.find(msg => msg.role === 'assistant' && msg.type === 'answer');
            
            if (botReply) {
              console.log('机器人回复:', botReply.content);
              return botReply.content;
            } else {
              console.log('未找到机器人回复');
            }
          }
          break;
        } else if (status === 'failed') {
          console.error('对话失败');
          break;
        }
        
        delay = Math.min(delay * 1.2, 3000);
      } catch (error) {
        console.error(`轮询错误:`, error.message);
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('轮询超时');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('错误详情:', error.response?.data);
    }
  }
}

testCozeComplete();