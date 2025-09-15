const axios = require('axios');

// 测试管理员登录状态和token有效性
async function testAdminStatus() {
  console.log('=== 管理员状态诊断 ===\n');
  
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // 1. 测试管理员登录
    console.log('1. 测试管理员登录...');
    const loginResponse = await axios.post(`${baseURL}/auth/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ 管理员登录成功');
    console.log('响应数据:', {
      accessToken: loginResponse.data.accessToken ? `${loginResponse.data.accessToken.substring(0, 20)}...` : 'null',
      refreshToken: loginResponse.data.refreshToken ? `${loginResponse.data.refreshToken.substring(0, 20)}...` : 'null',
      expiresIn: loginResponse.data.expiresIn
    });
    
    const accessToken = loginResponse.data.accessToken;
    
    // 2. 测试获取白名单列表
    console.log('\n2. 测试获取白名单列表...');
    const pairsResponse = await axios.get(`${baseURL}/admin/pairs`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page: 1,
        page_size: 10
      }
    });
    
    console.log('✅ 获取白名单列表成功');
    console.log('数据条数:', pairsResponse.data.data?.length || 0);
    console.log('总数:', pairsResponse.data.total || 0);
    
    // 3. 测试创建白名单项
    console.log('\n3. 测试创建白名单项...');
    const createResponse = await axios.post(`${baseURL}/admin/pairs`, {
      hospital_name: '测试医院_' + Date.now(),
      product_batch: 'TEST' + Date.now().toString().slice(-6)
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ 创建白名单项成功');
    console.log('创建的项目ID:', createResponse.data.id);
    
    const createdId = createResponse.data.id;
    
    // 4. 测试更新白名单项
    console.log('\n4. 测试更新白名单项...');
    const updateResponse = await axios.put(`${baseURL}/admin/pairs/${createdId}`, {
      hospital_name: '更新测试医院_' + Date.now()
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ 更新白名单项成功');
    
    // 5. 测试删除白名单项
    console.log('\n5. 测试删除白名单项...');
    const deleteResponse = await axios.delete(`${baseURL}/admin/pairs/${createdId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ 删除白名单项成功');
    
    // 6. 测试token刷新
    console.log('\n6. 测试token刷新...');
    const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
      refreshToken: loginResponse.data.refreshToken
    });
    
    console.log('✅ token刷新成功');
    console.log('新的accessToken:', refreshResponse.data.accessToken ? `${refreshResponse.data.accessToken.substring(0, 20)}...` : 'null');
    
    console.log('\n=== 所有测试通过！管理员API功能正常 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    // 如果是认证错误，提供详细信息
    if (error.response?.status === 401) {
      console.log('\n🔍 认证错误诊断:');
      console.log('- 检查管理员用户名和密码是否正确');
      console.log('- 检查token是否已过期');
      console.log('- 检查Authorization header格式是否正确');
    }
  }
}

// 运行测试
testAdminStatus();