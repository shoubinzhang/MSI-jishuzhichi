import sqlite3 from 'sqlite3';
import { createPool, Pool } from 'generic-pool';
import path from 'path';
import fs from 'fs';

// 确保数据目录存在
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 使用环境变量中的数据库路径或默认路径
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dataDir, 'database.sqlite');

// 数据库连接工厂
const factory = {
  create: async (): Promise<sqlite3.Database> => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // 启用外键约束
          db.run('PRAGMA foreign_keys = ON');
          // 设置忙等待超时
          db.run('PRAGMA busy_timeout = 30000');
          // 设置同步模式
          db.run('PRAGMA synchronous = NORMAL');
          // 设置缓存大小
          db.run('PRAGMA cache_size = 10000');
          resolve(db);
        }
      });
    });
  },
  destroy: async (db: sqlite3.Database): Promise<void> => {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接时出错:', err);
        }
        resolve();
      });
    });
  }
};

// 连接池配置
const poolOptions = {
  min: 2, // 最小连接数
  max: 10, // 最大连接数
  acquireTimeoutMillis: 30000, // 获取连接超时时间
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  evictionRunIntervalMillis: 10000, // 清理间隔
};

// 创建连接池
export const dbPool: Pool<sqlite3.Database> = createPool(factory, poolOptions);

// 连接池包装的数据库操作函数
export const pooledDbRun = async (sql: string, params?: any[]): Promise<{ lastID?: number; changes: number }> => {
  const db = await dbPool.acquire();
  try {
    return new Promise((resolve, reject) => {
      const callback = function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      };
      
      if (params) {
        db.run(sql, params, callback);
      } else {
        db.run(sql, callback);
      }
    });
  } finally {
    await dbPool.release(db);
  }
};

export const pooledDbGet = async (sql: string, params?: any[]): Promise<any> => {
  const db = await dbPool.acquire();
  try {
    return new Promise((resolve, reject) => {
      if (params) {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      } else {
        db.get(sql, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    });
  } finally {
    await dbPool.release(db);
  }
};

export const pooledDbAll = async (sql: string, params?: any[]): Promise<any[]> => {
  const db = await dbPool.acquire();
  try {
    return new Promise((resolve, reject) => {
      if (params) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      } else {
        db.all(sql, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      }
    });
  } finally {
    await dbPool.release(db);
  }
};

// 优雅关闭连接池
export const closePool = async (): Promise<void> => {
  try {
    await dbPool.drain();
    await dbPool.clear();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭数据库连接池时出错:', error);
  }
};

// 监听进程退出事件，确保连接池正确关闭
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
process.on('exit', closePool);