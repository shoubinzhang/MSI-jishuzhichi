import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwtUtils';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        hospitalName: string;
        productBatch: string;
      };
    }
  }
}

// JWT认证中间件
export const requireJWTAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('JWT认证 - Authorization头:', authHeader);
  
  const token = jwtUtils.extractTokenFromHeader(authHeader);
  console.log('JWT认证 - 提取的token:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.log('JWT认证失败 - 缺少token');
    return res.status(401).json({ error: '缺少访问令牌' });
  }
  
  const decoded = jwtUtils.verifyAccessToken(token);
  console.log('JWT认证 - token验证结果:', decoded ? '成功' : '失败');
  
  if (!decoded) {
    console.log('JWT认证失败 - token无效或过期');
    return res.status(401).json({ error: '访问令牌无效或已过期' });
  }
  
  // 将用户信息添加到请求对象
  req.user = {
    userId: decoded.userId,
    hospitalName: decoded.hospitalName,
    productBatch: decoded.productBatch
  };
  
  next();
};

// 用户认证中间件（兼容session和JWT）
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // 优先检查JWT token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return requireJWTAuth(req, res, next);
  }
  
  // 回退到session认证
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '请先登录' });
  }
  
  // 为session用户设置用户信息
  req.user = {
    userId: req.session.user.user_id,
    hospitalName: req.session.user.hospital_name,
    productBatch: req.session.user.product_batch
  };
  
  next();
};

// 管理员认证中间件
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // 优先检查JWT token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = jwtUtils.extractTokenFromHeader(authHeader);
    if (token) {
      const decoded = jwtUtils.verifyAccessToken(token);
      if (decoded && decoded.userId.startsWith('admin_')) {
        // JWT token验证成功且是管理员
        req.user = {
          userId: decoded.userId,
          hospitalName: decoded.hospitalName,
          productBatch: decoded.productBatch
        };
        return next();
      }
    }
  }
  
  // 回退到session认证
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: '需要管理员权限' });
  }
  next();
};