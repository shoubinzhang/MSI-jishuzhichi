import { Request, Response, NextFunction } from 'express';

// 性能监控数据存储
interface PerformanceMetric {
  path: string;
  method: string;
  duration: number;
  timestamp: number;
  statusCode: number;
  userAgent?: string;
}

const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000; // 最多保存1000条记录
const SLOW_REQUEST_THRESHOLD = 1000; // 慢请求阈值：1秒

// 性能监控中间件
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();
  
  // 重写res.end方法以记录响应时间
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const hrDuration = process.hrtime(startHrTime);
    const preciseMs = hrDuration[0] * 1000 + hrDuration[1] / 1000000;
    
    // 记录性能指标
    const metric: PerformanceMetric = {
      path: req.path,
      method: req.method,
      duration: Math.round(preciseMs),
      timestamp: endTime,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent')
    };
    
    // 添加到性能指标数组
    performanceMetrics.push(metric);
    
    // 保持数组大小在限制内
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }
    
    // 记录慢请求
    if (duration > SLOW_REQUEST_THRESHOLD) {
      console.warn(`🐌 慢请求检测: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // 记录所有请求（可选，用于调试）
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// 获取性能统计信息
export const getPerformanceStats = () => {
  const now = Date.now();
  const last24Hours = performanceMetrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000);
  const lastHour = performanceMetrics.filter(m => now - m.timestamp < 60 * 60 * 1000);
  
  const calculateStats = (metrics: PerformanceMetric[]) => {
    if (metrics.length === 0) return null;
    
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const total = metrics.length;
    const slowRequests = metrics.filter(m => m.duration > SLOW_REQUEST_THRESHOLD).length;
    
    return {
      total,
      slowRequests,
      slowRequestPercentage: ((slowRequests / total) * 100).toFixed(2),
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / total),
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(total * 0.5)],
      p90: durations[Math.floor(total * 0.9)],
      p95: durations[Math.floor(total * 0.95)],
      p99: durations[Math.floor(total * 0.99)]
    };
  };
  
  return {
    last24Hours: calculateStats(last24Hours),
    lastHour: calculateStats(lastHour),
    totalMetrics: performanceMetrics.length,
    oldestMetric: performanceMetrics.length > 0 ? new Date(performanceMetrics[0].timestamp) : null,
    newestMetric: performanceMetrics.length > 0 ? new Date(performanceMetrics[performanceMetrics.length - 1].timestamp) : null
  };
};

// 获取最慢的请求
export const getSlowestRequests = (limit: number = 10) => {
  return performanceMetrics
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit)
    .map(metric => ({
      ...metric,
      timestamp: new Date(metric.timestamp).toISOString()
    }));
};

// 获取特定路径的性能数据
export const getPathPerformance = (path: string) => {
  const pathMetrics = performanceMetrics.filter(m => m.path === path);
  const now = Date.now();
  const recent = pathMetrics.filter(m => now - m.timestamp < 60 * 60 * 1000); // 最近1小时
  
  if (recent.length === 0) return null;
  
  const durations = recent.map(m => m.duration).sort((a, b) => a - b);
  
  return {
    path,
    requestCount: recent.length,
    avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / recent.length),
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    slowRequests: recent.filter(m => m.duration > SLOW_REQUEST_THRESHOLD).length
  };
};

// 清理旧的性能数据
export const cleanupOldMetrics = (maxAgeHours: number = 24) => {
  const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
  const originalLength = performanceMetrics.length;
  
  // 移除旧数据
  for (let i = performanceMetrics.length - 1; i >= 0; i--) {
    if (performanceMetrics[i].timestamp < cutoffTime) {
      performanceMetrics.splice(i, 1);
    }
  }
  
  const removedCount = originalLength - performanceMetrics.length;
  if (removedCount > 0) {
    console.log(`🧹 清理了 ${removedCount} 条旧的性能数据`);
  }
  
  return removedCount;
};

// 定期清理旧数据
setInterval(() => {
  cleanupOldMetrics();
}, 60 * 60 * 1000); // 每小时清理一次