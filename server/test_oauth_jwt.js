const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// 生成OAuth JWT Token
const generateJWTToken = () => {
  const appId = process.env.COZE_APP_ID;
  const publicKeyFingerprint = process.env.COZE_PUBLIC_KEY_FINGERPRINT;
  
  if (!appId || !publicKeyFingerprint) {
    throw new Error('缺少OAuth配置（COZE_APP_ID或COZE_PUBLIC_KEY_FINGERPRINT）');
  }

  console.log('应用ID:', appId);
  console.log('公钥指纹:', publicKeyFingerprint);

  // 创建JWT payload
  const payload = {
    iss: appId,
    aud: 'api.coze.cn',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1小时过期
    jti: crypto.randomUUID()
  };

  console.log('JWT Payload:', payload);

  // 使用公钥指纹作为密钥（简化版本，实际应使用私钥）
  const token = jwt.sign(payload, publicKeyFingerprint, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  });

  return token;
};

// 测试OAuth JWT认证
const testOAuthJWT = async () => {
  try {
    console.log('=== 测试OAuth JWT认证 ===\n');
    
    // 生成JWT Token
    const jwtToken = generateJWTToken();
    console.log('生成的JWT Token:', jwtToken.substring(0, 50) + '...');
    
    const botId = process.env.COZE_BOT_ID;
    console.log('Bot ID:', botId);
    
    if (!botId) {
      throw new Error('缺少COZE_BOT_ID配置');
    }

    // 测试创建会话
    console.log('\n--- 测试创建会话 ---');
    const createConversationData = {
      bot_id: botId,
      meta_data: {
        app_user_id: 'test_user_' + Date.now()
      }
    };

    const conversationResponse = await axios.post(
      'https://api.coze.cn/v1/conversation/create',
      createConversationData,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('创建会话响应状态:', conversationResponse.status);
    console.log('创建会话响应数据:', JSON.stringify(conversationResponse.data, null, 2));
    
    if (conversationResponse.status === 200 || conversationResponse.status === 201) {
      console.log('\n✅ OAuth JWT认证测试成功！');
    } else {
      console.log('\n❌ OAuth JWT认证测试失败');
    }
    
  } catch (error) {
    console.error('\n❌ OAuth JWT认证测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
};

// 运行测试
testOAuthJWT();