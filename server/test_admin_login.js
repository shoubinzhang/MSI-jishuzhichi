const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('测试管理员登录功能...');

// 首先检查管理员用户
db.get('SELECT * FROM admin_users WHERE username = ?', ['admin'], (err, row) => {
  if (err) {
    console.error('查询管理员用户错误:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('未找到管理员用户');
    db.close();
    return;
  }
  
  console.log('找到管理员用户:');
  console.log('- ID:', row.id);
  console.log('- 用户名:', row.username);
  console.log('- 密码哈希:', row.password_hash);
  console.log('- 创建时间:', row.created_at);
  
  // 测试密码验证
  const testPassword = 'admin123';
  console.log('\n测试密码验证...');
  console.log('测试密码:', testPassword);
  
  try {
    const isValid = bcrypt.compareSync(testPassword, row.password_hash);
    console.log('密码验证结果:', isValid ? '成功' : '失败');
    
    if (!isValid) {
      console.log('\n尝试重新生成密码哈希...');
      const newHash = bcrypt.hashSync(testPassword, 12);
      console.log('新密码哈希:', newHash);
      
      // 更新密码哈希
      db.run('UPDATE admin_users SET password_hash = ? WHERE username = ?', [newHash, 'admin'], function(updateErr) {
        if (updateErr) {
          console.error('更新密码错误:', updateErr);
        } else {
          console.log('密码哈希已更新');
          
          // 再次验证
          const reVerify = bcrypt.compareSync(testPassword, newHash);
          console.log('重新验证结果:', reVerify ? '成功' : '失败');
        }
        db.close();
      });
    } else {
      db.close();
    }
  } catch (bcryptError) {
    console.error('bcrypt验证错误:', bcryptError);
    db.close();
  }
});