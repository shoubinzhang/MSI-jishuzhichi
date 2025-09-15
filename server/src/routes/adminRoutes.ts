import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { requireAdmin } from '../middleware/auth';
import { authPairsDao } from '../db/authPairsDao';
import { AuthPair } from '../types';
import { authPairsCacheMiddleware } from '../middleware/cacheMiddleware';

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

// 所有管理员路由都需要管理员权限
router.use(requireAdmin);

// 获取白名单列表
router.get('/pairs', authPairsCacheMiddleware, async (req, res, next) => {
  try {
    const keyword = req.query.keyword as string || '';
    const page = parseInt(req.query.page as string || '1');
    const pageSize = parseInt(req.query.page_size as string || '10');
    
    const { pairs, total } = await authPairsDao.getAll(keyword, page, pageSize);
    
    res.json({
      data: pairs,
      pagination: {
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 创建白名单项
router.post('/pairs', async (req, res, next) => {
  try {
    const { hospital_name, product_batch } = req.body;
    
    if (!hospital_name || !product_batch) {
      return res.status(400).json({ error: '医院名称和产品批号不能为空' });
    }
    
    // 验证产品批号格式
    const batchRegex = /^[A-Za-z0-9-]{6,32}$/;
    if (!batchRegex.test(product_batch)) {
      return res.status(400).json({ error: '产品批号格式不正确' });
    }
    
    try {
      const pair = await authPairsDao.create(hospital_name, product_batch);
      res.status(201).json(pair);
    } catch (err) {
      // 处理唯一约束冲突
      if ((err as any).code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: '该医院名称和产品批号组合已存在' });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

// 更新白名单项
router.put('/pairs/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { hospital_name, product_batch } = req.body;
    
    if (product_batch && !/^[A-Za-z0-9-]{6,32}$/.test(product_batch)) {
      return res.status(400).json({ error: '产品批号格式不正确' });
    }
    
    const success = await authPairsDao.update(id, { hospital_name, product_batch });
    
    if (!success) {
      return res.status(404).json({ error: '未找到指定ID的记录' });
    }
    
    res.json({ ok: true });
  } catch (error) {
    // 处理唯一约束冲突
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: '该医院名称和产品批号组合已存在' });
    }
    next(error);
  }
});

// 删除白名单项
router.delete('/pairs/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const success = await authPairsDao.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: '未找到指定ID的记录' });
    }
    
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// 导入CSV
router.post('/pairs/import-csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }
    
    const results: { hospital_name: string, product_batch: string }[] = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // 确保CSV包含必要的列
        if (data.hospital_name && data.product_batch) {
          results.push({
            hospital_name: data.hospital_name,
            product_batch: data.product_batch
          });
        }
      })
      .on('end', async () => {
        try {
          // 清理临时文件
          fs.unlinkSync(req.file!.path);
          
          if (results.length === 0) {
            return res.status(400).json({ error: 'CSV文件格式不正确或没有有效数据' });
          }
          
          // 批量导入
          const { success, failed } = await authPairsDao.bulkImport(results);
          
          res.json({
            ok: true,
            total: results.length,
            success,
            failed
          });
        } catch (error) {
          next(error);
        }
      })
      .on('error', (error) => {
        // 清理临时文件
        if (fs.existsSync(req.file!.path)) {
          fs.unlinkSync(req.file!.path);
        }
        next(error);
      });
  } catch (error) {
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// 导出CSV
router.get('/pairs/export-csv', async (req, res, next) => {
  try {
    const { pairs } = await authPairsDao.getAll('', 1, 10000); // 获取所有记录
    
    const tempDir = path.join(__dirname, '../../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, `auth_pairs_${Date.now()}.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'hospital_name', title: 'hospital_name' },
        { id: 'product_batch', title: 'product_batch' }
      ]
    });
    
    csvWriter.writeRecords(pairs.map(pair => ({
      hospital_name: pair.hospital_name,
      product_batch: pair.product_batch
    })))
      .then(() => {
        res.download(filePath, 'auth_pairs.csv', (err) => {
          // 下载完成后删除临时文件
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          if (err && !res.headersSent) {
            next(err);
          }
        });
      })
      .catch(next);
  } catch (error) {
    next(error);
  }
});

export default router;