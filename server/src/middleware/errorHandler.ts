import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('错误:', err);
  
  // 避免在生产环境中暴露详细错误信息
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message || '未知错误';
  
  res.status(500).json({ error: message });
};