const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 测试查询
const testQueries = [
  { hospital: '安徽省立医院', batch: '0000530742' },
  { hospital: '哈肿', batch: '0000530742' }
];

console.log('开始测试数据库查询...');

testQueries.forEach((test, index) => {
  console.log(`\n测试 ${index + 1}: 医院='${test.hospital}', 批号='${test.batch}'`);
  
  // 精确查询
  db.get('SELECT * FROM auth_pairs WHERE hospital_name = ? AND product_batch = ?', 
    [test.hospital, test.batch], 
    (err, row) => {
      if (err) {
        console.error('查询错误:', err);
      } else if (row) {
        console.log('✅ 找到匹配:', row);
      } else {
        console.log('❌ 未找到匹配');
        
        // 模糊查询来调试
        db.all('SELECT * FROM auth_pairs WHERE hospital_name LIKE ? OR product_batch LIKE ?',
          [`%${test.hospital}%`, `%${test.batch}%`],
          (err2, rows) => {
            if (err2) {
              console.error('模糊查询错误:', err2);
            } else {
              console.log('模糊查询结果:', rows.length, '条记录');
              rows.forEach(r => {
                console.log(`  - 医院: '${r.hospital_name}' (长度: ${r.hospital_name.length})`);
                console.log(`  - 批号: '${r.product_batch}' (长度: ${r.product_batch.length})`);
                console.log(`  - 医院匹配: ${r.hospital_name === test.hospital}`);
                console.log(`  - 批号匹配: ${r.product_batch === test.batch}`);
              });
            }
          }
        );
      }
    }
  );
});

// 延迟关闭数据库
setTimeout(() => {
  db.close();
  console.log('\n数据库连接已关闭');
}, 2000);