const path = require('path');
process.chdir(__dirname);

// 模拟TypeScript环境
require('ts-node/register');

// 导入DAO
const { authPairsDao } = require('./src/db/authPairsDao.ts');

async function testDao() {
  try {
    console.log('测试DAO查询功能...');
    
    const hospitalName = '上海市第一人民医院';
    const productBatch = '0000530742';
    
    console.log(`查询参数: 医院名称="${hospitalName}", 产品批号="${productBatch}"`);
    
    const result = await authPairsDao.getByHospitalAndBatch(hospitalName, productBatch);
    
    if (result) {
      console.log('✅ 查询成功，找到匹配记录:');
      console.log('ID:', result.id);
      console.log('医院名称:', `"${result.hospital_name}"`);
      console.log('产品批号:', `"${result.product_batch}"`);
    } else {
      console.log('❌ 查询失败，未找到匹配记录');
      
      // 尝试查看所有记录
      console.log('\n查看所有记录:');
      const allPairs = await authPairsDao.getAll();
      console.log('总记录数:', allPairs.total);
      allPairs.pairs.forEach((pair, index) => {
        console.log(`${index + 1}. 医院名称: "${pair.hospital_name}" (长度: ${pair.hospital_name.length})`);
        console.log(`   产品批号: "${pair.product_batch}" (长度: ${pair.product_batch.length})`);
      });
    }
  } catch (error) {
    console.error('测试出错:', error);
  }
}

testDao();