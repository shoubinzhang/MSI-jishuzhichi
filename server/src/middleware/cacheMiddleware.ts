import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// 创建缓存实例
const cache = new NodeCache({
  stdTTL: 300, // 默认5分钟过期
  checkperiod: 60, // 每60秒检查过期项
  useClones: false // 提高性能，不克隆对象
});

// 生成缓存键
function generateCacheKey(req: Request): string {
  const { method, originalUrl, body, query } = req;
  const keyData = {
    method,
    url: originalUrl,
    body: method === 'POST' ? body : undefined,
    query
  };
  return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
}

// 缓存中间件
export const cacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      console.log(`缓存命中: ${req.originalUrl}`);
      return res.json(cachedResponse);
    }

    // 重写res.json方法以缓存响应
    const originalJson = res.json;
    res.json = function(data: any) {
      // 只缓存成功的响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
        console.log(`缓存设置: ${req.originalUrl}`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// 特定路由的缓存中间件
export const authPairsCacheMiddleware = cacheMiddleware(600); // 10分钟
export const chatCacheMiddleware = cacheMiddleware(60); // 1分钟

// 清除缓存的工具函数
export const clearCache = (pattern?: string) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
    console.log(`清除了 ${matchingKeys.length} 个匹配的缓存项`);
  } else {
    cache.flushAll();
    console.log('清除了所有缓存');
  }
};

// 获取缓存统计信息
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

// 导出缓存实例以供其他模块使用
export { cache };