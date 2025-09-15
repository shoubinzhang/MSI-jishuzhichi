import db from './database';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../types';
import { promisify } from 'util';

interface DbRunResult {
  lastID?: number;
  changes: number;
}

const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<DbRunResult>;

export const adminUsersDao = {
  // 通过用户名获取管理员
  getByUsername: async (username: string): Promise<AdminUser | undefined> => {
    return await dbGet('SELECT * FROM admin_users WHERE username = ?', [username]) as AdminUser | undefined;
  },

  // 验证管理员密码
  verifyPassword: async (username: string, password: string): Promise<boolean> => {
    const admin = await dbGet('SELECT password_hash FROM admin_users WHERE username = ?', [username]) as AdminUser | undefined;
    
    if (!admin) return false;
    
    return bcrypt.compareSync(password, admin.password_hash);
  },

  // 更新管理员密码
  updatePassword: async (username: string, newPassword: string): Promise<boolean> => {
    const passwordHash = bcrypt.hashSync(newPassword, 12);
    const result = await dbRun('UPDATE admin_users SET password_hash = ? WHERE username = ?', [passwordHash, username]);
    return result.changes > 0;
  }
};