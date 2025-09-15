# 聊天功能调试指南

## 🔍 快速诊断步骤

### 1. 查看浏览器控制台
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Console" 标签页
3. 尝试发送聊天消息
4. 查看详细的错误日志

### 2. 错误信息解读

#### 常见错误类型：
- **401 错误**: 认证过期，需要重新登录
- **403 错误**: 没有权限，检查用户权限设置
- **500 错误**: 服务器内部错误，检查后端服务
- **网络错误**: 连接问题，检查网络和代理设置

#### 错误日志格式：
```
聊天消息发送失败:
错误对象: [详细错误对象]
错误消息: [具体错误信息]
响应状态: [HTTP状态码]
响应数据: [服务器返回的错误数据]
错误详情 (JSON): [结构化错误信息]
```

### 3. 使用测试工具

#### 简单测试页面
访问: `http://localhost:5173/test_chat_simple.html`

功能：
- 环境检查
- 登录测试
- 聊天API测试
- 网络连接测试

#### 详细诊断页面
访问: `http://localhost:5173/diagnose_frontend_chat_detailed.html`

功能：
- 完整的前端环境诊断
- Token状态检查
- API连接测试

### 4. 常见问题解决方案

#### 问题1: Token过期
**症状**: 控制台显示401错误
**解决**: 重新登录获取新的token

#### 问题2: 网络连接问题
**症状**: 控制台显示网络错误或超时
**解决**: 
- 检查前端服务是否运行在 http://localhost:5173
- 检查后端服务是否运行在 http://localhost:5000
- 检查Vite代理配置

#### 问题3: 服务器错误
**症状**: 控制台显示500错误
**解决**: 
- 检查后端服务日志
- 确认数据库连接正常
- 检查环境变量配置

#### 问题4: 权限问题
**症状**: 控制台显示403错误
**解决**: 
- 确认用户已正确登录
- 检查用户权限设置
- 验证医院名称和产品批号是否在白名单中

### 5. 手动测试步骤

#### 测试登录功能
```javascript
// 在浏览器控制台执行
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    hospital_name: '测试医院',
    product_batch: 'TEST001'
  })
}).then(r => r.json()).then(console.log);
```

#### 测试聊天API
```javascript
// 在浏览器控制台执行 (需要先登录)
const token = localStorage.getItem('accessToken');
fetch('/api/chat/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify({ message: '你好' })
}).then(r => r.json()).then(console.log);
```

### 6. 联系支持

如果以上步骤无法解决问题，请提供：
1. 浏览器控制台的完整错误日志
2. 网络标签页中的请求详情
3. 当前的环境配置信息
4. 重现问题的具体步骤

---

## 📝 更新日志

- 添加了详细的错误日志记录
- 改进了错误消息显示
- 创建了多个诊断工具
- 增强了错误处理机制