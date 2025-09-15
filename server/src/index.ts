import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import { errorHandler } from './middleware/errorHandler';
import { performanceMiddleware } from './middleware/performanceMiddleware';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import chatRoutes from './routes/chatRoutes';
import wechatRoutes from './routes/wechatRoutes';
import qrcodeRoutes from './routes/qrcodeRoutes';
import performanceRoutes from './routes/performanceRoutes';
import networkRoutes from './routes/networkRoutes';


// 加载环境变量
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });  // 恢复 "../" 前缀以正确定位环境文件

// 初始化数据库
initDatabase();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.coze.cn"]
    }
  } : false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, process.env.CORS_ORIGIN].filter(Boolean) as string[]
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// 请求体解析 - 添加字符编码支持
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// 设置字符编码
app.use((req, res, next) => {
  req.setEncoding = req.setEncoding || (() => {});
  next();
});

// 性能监控中间件
app.use(performanceMiddleware);

// 会话管理
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'default-secret-key-change-in-production'],
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
}));

// 登录限流
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 最多20次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' }
});

app.use('/api/auth/login', loginLimiter);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wechat', wechatRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/network', networkRoutes);

// API状态信息移到专门的端点
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '医院登录系统后端服务',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin', 
      chat: '/api/chat'
    }
  });
});

// 在生产环境中提供前端静态文件
if (process.env.NODE_ENV === 'production') {
  console.log('启用生产环境静态文件服务');
  // 静态文件服务
  app.use(express.static(path.resolve(__dirname, 'static')));
  
  // SPA路由处理 - 所有非API路由都返回前端页面
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'static/index.html'));
  });
} else {
  // 开发环境下启用静态文件服务（用于调试）
  console.log('开发环境模式，启用静态文件服务用于调试');
  app.use(express.static(path.resolve(__dirname, 'static')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'static/index.html'));
  });
}

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`局域网访问地址: http://172.30.81.103:${PORT}`);
});