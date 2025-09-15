import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { promisify } from 'util';

// 确保数据目录存在
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 使用环境变量中的数据库路径或默认路径
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 将sqlite3方法转换为Promise
interface DbRunResult {
  lastID?: number;
  changes: number;
}

// 自定义dbRun函数以正确处理sqlite3的返回值
export const dbRun = (sql: string, params?: any[]): Promise<DbRunResult> => {
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
};

export const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
export const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;
const dbExec = promisify(db.exec.bind(db)) as (sql: string) => Promise<void>;

// 初始化数据库表
export async function initDatabase(): Promise<void> {
  // 创建auth_pairs表
  await dbExec(`
    CREATE TABLE IF NOT EXISTS auth_pairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_name TEXT NOT NULL,
      product_batch TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(hospital_name, product_batch)
    )
  `);

  // 创建admin_users表
  await dbExec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // 创建user_sessions表
  await dbExec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      session_data TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  // 创建索引以优化查询性能
  try {
    // 为auth_pairs表创建复合索引
    await dbExec(`CREATE INDEX IF NOT EXISTS idx_auth_pairs_hospital_batch ON auth_pairs(hospital_name, product_batch)`);
    await dbExec(`CREATE INDEX IF NOT EXISTS idx_auth_pairs_created_at ON auth_pairs(created_at)`);
    
    // 为admin_users表创建索引
    await dbExec(`CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)`);
    
    // 为user_sessions表创建索引
    await dbExec(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)`);
    
    console.log('数据库索引创建完成');
  } catch (error) {
    console.error('创建数据库索引时出错:', error);
  }

  // 检查是否需要创建默认管理员账户
  const adminCount = await dbGet('SELECT COUNT(*) as count FROM admin_users') as { count: number };
  
  if (adminCount.count === 0) {
    const username = 'admin';
    let password = process.env.ADMIN_PASSWORD;
    
    // 如果环境变量中没有设置密码，则生成随机密码
    if (!password) {
      password = crypto.randomBytes(8).toString('hex');
      console.log(`\n初始管理员账户已创建:\n用户名: ${username}\n密码: ${password}\n请保存此密码，它只会显示一次！\n`);
    }
    
    const passwordHash = bcrypt.hashSync(password, 12);
    
    await dbRun(`
      INSERT INTO admin_users (username, password_hash, created_at)
      VALUES (?, ?, ?)
    `, [username, passwordHash, Math.floor(Date.now() / 1000)]);
  }
}

export default db;