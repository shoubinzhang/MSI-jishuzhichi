import { Router, Request, Response } from 'express';
import wechatService from '../services/wechatService';

const router = Router();

/**
 * 微信服务器验证接口
 */
router.get('/verify', (req: Request, res: Response) => {
  const { signature, timestamp, nonce, echostr } = req.query as {
    signature: string;
    timestamp: string;
    nonce: string;
    echostr: string;
  };

  try {
    // 验证签名
    const isValid = wechatService.verifySignature(signature, timestamp, nonce);
    
    if (isValid) {
      console.log('微信服务器验证成功');
      res.send(echostr);
    } else {
      console.log('微信服务器验证失败');
      res.status(403).send('验证失败');
    }
  } catch (error) {
    console.error('微信验证错误:', error);
    res.status(500).send('服务器错误');
  }
});

/**
 * 获取微信授权URL
 */
router.get('/auth-url', (req: Request, res: Response) => {
  try {
    const { redirect_uri, state } = req.query as {
      redirect_uri: string;
      state?: string;
    };

    if (!redirect_uri) {
      return res.status(400).json({ error: '缺少redirect_uri参数' });
    }

    const authUrl = wechatService.getAuthUrl(redirect_uri, state);
    res.json({ authUrl });
  } catch (error) {
    console.error('获取微信授权URL错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * 微信授权回调处理
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as {
      code: string;
      state: string;
    };

    if (!code) {
      return res.status(400).json({ error: '缺少授权码' });
    }

    // 获取access_token
    const tokenData = await wechatService.getAccessToken(code);
    
    // 获取用户信息
    const userInfo = await wechatService.getUserInfo(tokenData.access_token, tokenData.openid);
    
    // 将用户信息存储到session
    req.session = {
        ...req.session,
        wechatUser: {
          openid: userInfo.openid,
          nickname: userInfo.nickname,
          headimgurl: userInfo.headimgurl,
        },
        isWechatAuth: true
    };

    // 重定向到前端页面
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}?wechat_auth=success&state=${state}`);
    
  } catch (error) {
    console.error('微信授权回调错误:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}?wechat_auth=error&message=${encodeURIComponent('授权失败')}`);
  }
});

/**
 * 获取当前微信用户信息
 */
router.get('/user', (req: Request, res: Response) => {
  try {
    if (!req.session?.isWechatAuth || !req.session?.wechatUser) {
      return res.status(401).json({ error: '未授权' });
    }

    const { wechatUser } = req.session;
    res.json({
      openid: wechatUser.openid,
      nickname: wechatUser.nickname,
      headimgurl: wechatUser.headimgurl
    });
  } catch (error) {
    console.error('获取微信用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * 微信登出
 */
router.post('/logout', (req: Request, res: Response) => {
  try {
    if (req.session) {
      req.session.isWechatAuth = false;
      req.session.wechatUser = null;
    }
    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('微信登出错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;