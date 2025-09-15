import express from 'express';
import { requireAdmin } from '../middleware/auth';
import { 
  getPerformanceStats, 
  getSlowestRequests, 
  getPathPerformance,
  cleanupOldMetrics 
} from '../middleware/performanceMiddleware';

const router = express.Router();

// 所有性能监控路由都需要管理员权限
router.use(requireAdmin);

// 获取性能统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = getPerformanceStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取性能统计失败'
    });
  }
});

// 获取最慢的请求
router.get('/slowest', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const slowestRequests = getSlowestRequests(limit);
    res.json({
      success: true,
      data: slowestRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取慢请求数据失败'
    });
  }
});

// 获取特定路径的性能数据
router.get('/path/:path(*)', (req, res) => {
  try {
    const path = '/' + req.params.path;
    const pathPerformance = getPathPerformance(path);
    
    if (!pathPerformance) {
      return res.status(404).json({
        success: false,
        error: '未找到该路径的性能数据'
      });
    }
    
    res.json({
      success: true,
      data: pathPerformance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取路径性能数据失败'
    });
  }
});

// 清理旧的性能数据
router.post('/cleanup', (req, res) => {
  try {
    const maxAgeHours = parseInt(req.body.maxAgeHours) || 24;
    const removedCount = cleanupOldMetrics(maxAgeHours);
    
    res.json({
      success: true,
      message: `已清理 ${removedCount} 条旧的性能数据`,
      removedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '清理性能数据失败'
    });
  }
});

export default router;