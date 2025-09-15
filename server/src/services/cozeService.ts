import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { CozeCreateConversationRequest, CozeCreateConversationResponse, CozeSendMessageRequest, CozeSendMessageResponse } from '../types';

// 生成用户ID，确保跨会话稳定且不暴露真实业务标识
export const generateUserId = (hospitalName: string, productBatch: string): string => {
  const salt = process.env.USER_ID_SALT || 'default-salt-for-user-id-generation';
  const data = `${hospitalName}:${productBatch}:${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// 获取认证Token（使用Personal Access Token）
const getAuthToken = (): string => {
  const pat = process.env.COZE_PAT;
  if (!pat) {
    throw new Error('缺少Coze Personal Access Token配置（COZE_PAT）');
  }
  return pat;
};

// Coze服务
export const cozeService = {
  // V3 API不需要单独创建会话，直接在chat接口中处理
  createConversationIfNeeded: async (userId: string, existingConversationId?: string): Promise<string> => {
    // V3 API会在首次聊天时自动创建会话，返回用户ID作为标识
    return existingConversationId || userId;
  },

  // 发送消息（使用Coze V3 API）
  sendMessage: async (conversationId: string, userId: string, text: string): Promise<string> => {
    try {
      const authToken = getAuthToken();
      const cozeBotId = process.env.COZE_BOT_ID;

      if (!cozeBotId) {
        throw new Error('缺少Coze Bot ID配置（COZE_BOT_ID）');
      }

      // Coze V3 API请求格式
      const requestData = {
        bot_id: cozeBotId,
        user_id: userId,
        stream: false,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'user',
            content: text,
            content_type: 'text'
          }
        ]
      };

      // 如果有会话ID，添加到URL参数中
      const apiUrl = conversationId && conversationId !== userId 
        ? `https://api.coze.cn/v3/chat?conversation_id=${conversationId}`
        : 'https://api.coze.cn/v3/chat';

      const response = await axios.post(
        apiUrl,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Coze API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应状态
      if (response.data.code !== 0) {
        throw new Error(`Coze API错误: ${response.data.msg || '未知错误'}`);
      }

      const chatData = response.data.data;
      if (!chatData) {
        throw new Error('Coze API响应中缺少data字段');
      }

      // 获取chat_id和conversation_id用于后续查询
      const chatId = chatData.id;
      const newConversationId = chatData.conversation_id;

      if (!chatId) {
        throw new Error('无法从Coze API响应中获取chat_id');
      }

      // 优化的轮询策略：指数退避算法
      const retrieveUrl = `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${newConversationId}`;
      
      let attempts = 0;
      const maxAttempts = 20; // 减少最大尝试次数
      let delay = 500; // 初始延迟500ms
      const maxDelay = 5000; // 最大延迟5秒
      
      // 等待对话完成 - 使用指数退避
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          const retrieveResponse = await axios.get(retrieveUrl, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10秒超时
          });
          
          if (retrieveResponse.data.code === 0 && retrieveResponse.data.data) {
            const status = retrieveResponse.data.data.status;
            console.log(`对话状态检查 ${attempts + 1}: ${status} (延迟: ${delay}ms)`);
            
            if (status === 'completed') {
              // 对话完成，获取消息列表
              const messageUrl = `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${newConversationId}`;
              
              const messageResponse = await axios.get(messageUrl, {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              });
              
              if (messageResponse.data.code === 0 && messageResponse.data.data) {
                const messages = messageResponse.data.data;
                const botReply = messages.find((msg: any) => msg.role === 'assistant' && msg.type === 'answer');
                
                if (botReply) {
                  return botReply.content;
                }
              }
              break;
            } else if (status === 'failed') {
              throw new Error('Coze对话处理失败');
            }
            
            // 如果状态是in_progress，使用较短的延迟
            if (status === 'in_progress') {
              delay = Math.min(delay * 1.2, 2000); // 渐进增加，最大2秒
            } else {
              delay = Math.min(delay * 1.5, maxDelay); // 指数退避
            }
          }
        } catch (error) {
          console.error(`轮询错误 ${attempts + 1}:`, error);
          delay = Math.min(delay * 2, maxDelay); // 错误时快速退避
        }
        
        attempts++;
      }
      
      // 备用轮询机制：直接查询消息列表
      const messageUrl = `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${newConversationId}`;
      attempts = 0;
      delay = 1000; // 重置延迟
      
      while (attempts < 10) { // 减少备用轮询次数
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          const messageResponse = await axios.get(messageUrl, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000 // 8秒超时
          });

          if (messageResponse.data.code === 0 && messageResponse.data.data) {
            const messages = messageResponse.data.data;
            
            // 查找assistant的回答
            const answerMessage = messages.find((msg: any) => 
              msg.role === 'assistant' && msg.type === 'answer'
            );
            
            if (answerMessage && answerMessage.content) {
              return answerMessage.content;
            }
          }
        } catch (pollError) {
          console.warn('轮询消息时出错:', pollError);
          delay = Math.min(delay * 1.5, 3000); // 指数退避，最大3秒
        }
        
        attempts++;
      }

      throw new Error('获取Coze回答超时');
    } catch (error) {
      console.error('发送Coze消息失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('错误详情:', error.response?.data);
      }
      throw new Error('发送Coze消息失败');
    }
  }
};