require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testCozeAPI() {
  try {
    console.log('测试Coze V3 API配置...');
    console.log('COZE_PAT:', process.env.COZE_PAT ? '已配置' : '未配置');
    console.log('COZE_BOT_ID:', process.env.COZE_BOT_ID);
    
    const requestData = {
      bot_id: process.env.COZE_BOT_ID,
      user_id: 'test_user_123',
      stream: false,
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: '你好，请简单回复一下',
          content_type: 'text'
        }
      ]
    };
    
    console.log('发送请求到Coze API...');
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(
      'https://api.coze.cn/v3/chat',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.COZE_PAT}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 0) {
      console.log('✅ Coze API调用成功!');
      const chatId = response.data.data.id;
      console.log('Chat ID:', chatId);
      
      // 轮询获取结果
      const conversationId = response.data.data.conversation_id;
      console.log('开始轮询获取结果...');
      console.log('Conversation ID:', conversationId);
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const retrieveResponse = await axios.get(
            `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.COZE_PAT}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`轮询 ${i + 1}:`, JSON.stringify(retrieveResponse.data, null, 2));
          
          if (retrieveResponse.data.data && retrieveResponse.data.data.status === 'completed') {
            console.log('✅ 对话完成!');
            
            // 获取消息列表
            const messagesResponse = await axios.get(
              `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.COZE_PAT}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('消息列表响应:', JSON.stringify(messagesResponse.data, null, 2));
            
            const messages = messagesResponse.data.data;
            if (messages && Array.isArray(messages)) {
              const botReply = messages.find(msg => msg.role === 'assistant' && msg.type === 'answer');
              
              if (botReply) {
                console.log('🤖 机器人回复:', botReply.content);
              } else {
                console.log('未找到机器人回复');
              }
            } else {
               console.log('消息列表格式异常');
             }
             break;
          }
        } catch (retrieveError) {
          console.error('轮询错误:', retrieveError.response?.data || retrieveError.message);
        }
      }
    } else {
      console.error('❌ Coze API调用失败:', response.data.msg);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:');
    if (axios.isAxiosError(error)) {
      console.error('状态码:', error.response?.status);
      console.error('错误响应:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

testCozeAPI();