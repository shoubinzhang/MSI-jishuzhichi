import express from 'express';
import { authPairsDao } from '../db/authPairsDao';
import { adminUsersDao } from '../db/adminUsersDao';
import { requireAuth } from '../middleware/auth';
import { cozeService, generateUserId } from '../services/cozeService';
import { jwtUtils } from '../utils/jwtUtils';
import { LoginRequest, AdminLoginRequest } from '../types';

const router = express.Router();

// 用户登录
router.post('/login', async (req, res, next) => {
  try {
    const { hospital_name, product_batch } = req.body;
    
    // 调试日志
    console.log('登录请求数据:', {
      hospital_name: hospital_name,
      product_batch: product_batch,
      hospital_name_length: hospital_name?.length,
      product_batch_length: product_batch?.length,
      hospital_name_type: typeof hospital_name,
      product_batch_type: typeof product_batch
    });
    
    // 验证输入
    if (!hospital_name || !product_batch) {
      return res.status(400).json({ ok: false, message: '医院名称和产品批号不能为空' });
    }
    
    // 验证产品批号格式
    const batchRegex = /^[A-Za-z0-9-]{6,32}$/;
    if (!batchRegex.test(product_batch)) {
      return res.status(400).json({ ok: false, message: '产品批号格式不正确' });
    }
    
    // 检查是否存在于白名单
    console.log('查询前参数:', {
      hospital_name: hospital_name,
      product_batch: product_batch,
      hospital_name_trimmed: hospital_name.trim(),
      product_batch_trimmed: product_batch.trim(),
      hospital_name_bytes: Buffer.from(hospital_name, 'utf8'),
      product_batch_bytes: Buffer.from(product_batch, 'utf8')
    });
    
    const authPair = await authPairsDao.getByHospitalAndBatch(hospital_name, product_batch);
    
    console.log('查询结果:', authPair ? '找到匹配' : '未找到匹配');
    
    if (!authPair) {
      return res.status(401).json({ ok: false, message: '验证失败，医院名称或产品批号不正确' });
    }
    
    // 生成用户ID
    const userId = generateUserId(hospital_name, product_batch);
    
    // 尝试创建或获取Coze会话（如果失败不影响登录）
    let conversationId = null;
    try {
      conversationId = await cozeService.createConversationIfNeeded(userId);
    } catch (cozeError) {
      console.warn('Coze服务暂时不可用，但用户仍可登录:', (cozeError as Error).message);
    }
    
    // 生成JWT token对
    const tokenPair = jwtUtils.generateTokenPair(userId, hospital_name, product_batch);
    
    // 设置会话（向后兼容）
    if (req.session) {
      req.session.user = {
        hospital_name,
        product_batch,
        user_id: userId,
        conversation_id: conversationId ?? undefined
      };
    }

    res.json({ 
      ok: true,
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息
router.get('/me', requireAuth, (req, res) => {
  // 优先使用JWT token中的用户信息，回退到session
  const hospitalName = req.user?.hospitalName || req.session?.user?.hospital_name;
  const productBatch = req.user?.productBatch || req.session?.user?.product_batch;
  const hasConversation = !!req.session?.user?.conversation_id;
  
  res.json({
    hospital_name: hospitalName,
    product_batch: productBatch,
    has_conversation: hasConversation
  });
});

// 刷新JWT token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ ok: false, message: '缺少刷新令牌' });
  }
  
  const newTokenPair = jwtUtils.refreshTokenPair(refreshToken);
  
  if (!newTokenPair) {
    return res.status(401).json({ ok: false, message: '刷新令牌无效或已过期' });
  }
  
  res.json({
    ok: true,
    tokens: {
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresIn: newTokenPair.expiresIn
    }
  });
});

// 用户登出
router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// 管理员登录
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body as AdminLoginRequest;
    
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: '用户名和密码不能为空' });
    }
    
    // 验证管理员凭据
    const isValid = await adminUsersDao.verifyPassword(username, password);
    
    if (!isValid) {
      return res.status(401).json({ ok: false, message: '用户名或密码错误' });
    }
    
    // 生成管理员专用的JWT token
    const adminUserId = `admin_${username}`;
    const tokenPair = jwtUtils.generateTokenPair(adminUserId, 'admin', 'admin');
    
    // 设置管理员会话
    if (req.session) {
      req.session.isAdmin = true;
      req.session.adminUser = {
        username,
        user_id: adminUserId
      };
    }
    
    res.json({ 
      ok: true,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn
    });
  } catch (error) {
    next(error);
  }
});

// 管理员登出
router.post('/admin/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

export default router;