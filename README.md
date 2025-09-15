# 医院产品验证登录工具

这是一个基于Node.js、Express、React和TypeScript的医院产品验证登录系统，集成了Coze AI聊天功能。

## 功能特点

- 用户通过医院名称和产品批号登录
- 管理员可以管理白名单（添加、编辑、删除、导入、导出）
- 集成Coze AI聊天功能
- 安全的会话管理和认证

## 环境要求

- Node.js 16+
- npm 或 yarn

## 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖（前端和后端）
npm run setup
```

### 2. 配置环境变量

在server目录下创建.env文件（可以复制.env.example并修改）：

```
# 必须配置的环境变量
COZE_BOT_ID=your_coze_bot_id_here  # 替换为你的Coze Bot ID
```

### 3. 开发模式运行

```bash
# 同时启动前端和后端开发服务器
npm run dev

# 或者分别启动
npm run server:dev  # 启动后端服务器
npm run client:dev  # 启动前端开发服务器
```

### 4. 构建生产版本

```bash
# 构建前端和后端
npm run build

# 启动生产服务器
npm run start
```

## 访问应用

- 前端开发服务器: http://localhost:5173
- 后端API服务器: http://localhost:3001
- 生产模式（构建后）: http://localhost:3001

## 默认账户

### 管理员账户
- 用户名: admin
- 密码: admin123

## 项目结构

```
登陆工具/
├── client/                # 前端React应用
│   ├── src/
│   │   ├── api/           # API调用
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   └── ...
│   └── ...
├── server/                # 后端Express应用
│   ├── src/
│   │   ├── db/            # 数据库相关
│   │   ├── middleware/    # Express中间件
│   │   ├── routes/        # API路由
│   │   ├── services/      # 业务逻辑服务
│   │   └── ...
│   └── ...
└── ...
```