import { pooledDbRun, pooledDbGet, pooledDbAll } from './connectionPool';
import { AuthPair } from '../types';

export const authPairsDao = {
  // 获取所有认证对
  getAll: async (keyword: string = '', page: number = 1, pageSize: number = 10): Promise<{ pairs: AuthPair[], total: number }> => {
    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM auth_pairs';
    let countQuery = 'SELECT COUNT(*) as count FROM auth_pairs';
    let queryParams: any[] = [];
    let countParams: any[] = [];

    if (keyword) {
      query += ' WHERE hospital_name LIKE ? OR product_batch LIKE ?';
      countQuery += ' WHERE hospital_name LIKE ? OR product_batch LIKE ?';
      queryParams = [`%${keyword}%`, `%${keyword}%`];
      countParams = [`%${keyword}%`, `%${keyword}%`];
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);

    const pairs = await pooledDbAll(query, queryParams) as AuthPair[];
    const total = (await pooledDbGet(countQuery, countParams) as { count: number }).count;

    return { pairs, total };
  },

  // 通过ID获取认证对
  getById: async (id: number): Promise<AuthPair | undefined> => {
    return await pooledDbGet('SELECT * FROM auth_pairs WHERE id = ?', [id]) as AuthPair | undefined;
  },

  // 通过医院名称和产品批号获取认证对
  getByHospitalAndBatch: async (hospitalName: string, productBatch: string): Promise<AuthPair | undefined> => {
    return await pooledDbGet('SELECT * FROM auth_pairs WHERE hospital_name = ? AND product_batch = ?',
      [hospitalName.trim(), productBatch.trim()]) as AuthPair | undefined;
  },

  // 创建新的认证对
  create: async (hospitalName: string, productBatch: string): Promise<AuthPair> => {
    const now = Math.floor(Date.now() / 1000);
    
    try {
      const result = await pooledDbRun(
        'INSERT INTO auth_pairs (hospital_name, product_batch, created_at) VALUES (?, ?, ?)',
        [hospitalName.trim(), productBatch.trim(), now]
      );

      console.log('dbRun result:', result);

      if (!result || typeof result.lastID !== 'number' || result.lastID <= 0) {
        console.error('Invalid dbRun result:', result);
        throw new Error('Failed to create auth pair: Invalid database result');
      }

      return {
        id: result.lastID,
        hospital_name: hospitalName.trim(),
        product_batch: productBatch.trim(),
        created_at: now
      };
    } catch (error: any) {
      console.error('Error in authPairsDao.create:', error);
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT') {
        throw error; // 重新抛出约束错误，让上层处理
      }
      throw new Error(`Failed to create auth pair: ${error.message}`);
    }
  },

  // 更新认证对
  update: async (id: number, data: Partial<AuthPair>): Promise<boolean> => {
    console.log('authPairsDao.update called with:', { id, data });
    
    const pair = await pooledDbGet('SELECT * FROM auth_pairs WHERE id = ?', [id]) as AuthPair | undefined;
    console.log('Found existing pair:', pair);
    
    if (!pair) {
      console.log('No pair found with id:', id);
      return false;
    }

    const hospitalName = data.hospital_name !== undefined ? data.hospital_name.trim() : pair.hospital_name;
    const productBatch = data.product_batch !== undefined ? data.product_batch.trim() : pair.product_batch;

    console.log('Updating with values:', { hospitalName, productBatch, id });
    
    const result = await pooledDbRun(
      'UPDATE auth_pairs SET hospital_name = ?, product_batch = ? WHERE id = ?',
      [hospitalName, productBatch, id]
    );
    
    console.log('Update result:', result);
    const success = (result && result.changes) ? result.changes > 0 : false;
    console.log('Update success:', success);

    return success;
  },

  // 删除认证对
  delete: async (id: number): Promise<boolean> => {
    const result = await pooledDbRun('DELETE FROM auth_pairs WHERE id = ?', [id]);
    return (result && result.changes) ? result.changes > 0 : false;
  },

  // 批量导入认证对
  bulkImport: async (pairs: { hospital_name: string, product_batch: string }[]): Promise<{ success: number, failed: number }> => {
    const now = Math.floor(Date.now() / 1000);
    let success = 0;
    let failed = 0;

    // 使用 sqlite3 的串行化执行来模拟事务
    await pooledDbRun('BEGIN TRANSACTION');
    
    try {
      for (const item of pairs) {
        try {
          const result = await pooledDbRun(
            'INSERT OR IGNORE INTO auth_pairs (hospital_name, product_batch, created_at) VALUES (?, ?, ?)',
            [item.hospital_name.trim(), item.product_batch.trim(), now]
          );
          if (result && result.changes && result.changes > 0) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }
      }
      await pooledDbRun('COMMIT');
    } catch (error) {
      await pooledDbRun('ROLLBACK');
      throw error;
    }

    return { success, failed };
  }
};