import express from 'express';
import { requireAuth } from '../middleware/auth';
import { cozeService } from '../services/cozeService';
import { chatCacheMiddleware } from '../middleware/cacheMiddleware';

const router = express.Router();

// 所有聊天路由都需要用户认证
router.use(requireAuth);

// 发送消息
router.post('/send', chatCacheMiddleware, async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: '用户未登录' });
    }
    
    // 获取session中的conversation_id（如果存在）
    const sessionConversationId = req.session?.user?.conversation_id;
    
    // 如果用户没有conversation_id，使用createConversationIfNeeded创建或获取
    const conversationId = await cozeService.createConversationIfNeeded(
      user.userId,
      sessionConversationId
    );

    const answer = await cozeService.sendMessage(
      conversationId,
      user.userId,
      message
    );
    
    res.json({ answer, conversation_id: conversationId });
  } catch (error) {
    next(error);
  }
});

export default router;