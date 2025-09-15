import axios from 'axios';
import TokenManager from '../utils/tokenManager';

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// 缓存工具函数 - 导出以供使用或移除未使用的函数
export const getCacheKey = (url: string, params?: any) => {
  return `${url}${params ? JSON.stringify(params) : ''}`;
};

export const getFromCache = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

export const setCache = (key: string, data: any, ttl: number = 5 * 60 * 1000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

export const clearCacheByPattern = (pattern: string) => {
  console.log('清理缓存，模式:', pattern, '当前缓存键:', Array.from(cache.keys()));
  let clearedCount = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      clearedCount++;
      console.log('已清理缓存键:', key);
    }
  }
  console.log('共清理缓存项:', clearedCount);
};

// 清理所有缓存的函数
export const clearAllCache = () => {
  console.log('清理所有缓存，当前缓存项数量:', cache.size);
  cache.clear();
  console.log('缓存已全部清理');
};

const api = axios.create({
  baseURL: '/api', // 在开发环境中通过Vite代理访问后端
  withCredentials: true,
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求去重机制
const pendingRequests = new Map<string, Promise<any>>();

const getRequestKey = (config: any) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
};

// 请求拦截器 - 实现请求去重和JWT token认证
api.interceptors.request.use(
  config => {
    const requestKey = getRequestKey(config);

    // 只对GET请求进行去重，聊天请求由chatApi.sendMessage单独处理
    if (config.method === 'get') {
      const pendingRequest = pendingRequests.get(requestKey);
      if (pendingRequest) {
        console.log('请求去重:', requestKey);
        return Promise.reject(new Error('DUPLICATE_REQUEST'));
      }
    }

    // 添加JWT token到请求头
     const authHeader = TokenManager.getAuthHeader();
     if (authHeader) {
       config.headers.Authorization = authHeader;
     }

    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器 - 处理401错误、JWT token刷新和清理请求去重
api.interceptors.response.use(
  response => {
    // 清理已完成的请求
    const requestKey = getRequestKey(response.config);
    pendingRequests.delete(requestKey);
    return response;
  },
  async error => {
    // 清理失败的请求
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }

    // 忽略重复请求错误
    if (error.message === 'DUPLICATE_REQUEST') {
      return Promise.reject(new Error('请求正在处理中，请稍候...'));
    }

    if (error.response && error.response.status === 401) {
         // 尝试刷新token
         const refreshSuccess = await TokenManager.refreshTokens();
         if (refreshSuccess) {
           // 重试原始请求
           const authHeader = TokenManager.getAuthHeader();
           if (authHeader) {
             error.config.headers.Authorization = authHeader;
             return api.request(error.config);
           }
         }
         
         // 刷新失败或没有token，重定向到登录页面
         const isAdminPath = window.location.pathname.startsWith('/admin');
         window.location.href = isAdminPath ? '/admin/login' : '/login';
       }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (hospitalName: string, productBatch: string) => {
    const response = await api.post('/auth/login', {
      hospital_name: hospitalName,
      product_batch: productBatch
    });
    
    // 如果响应包含JWT token，存储它们
    if (response.data.tokens && response.data.tokens.accessToken && response.data.tokens.refreshToken) {
      TokenManager.setTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        expiresIn: response.data.tokens.expiresIn
      });
    }
    
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 用户登出
  logout: async () => {
    const response = await api.post('/auth/logout');
    // 清除本地存储的token
    TokenManager.clearTokens();
    return response.data;
  },

  // 管理员登录
  adminLogin: async (username: string, password: string) => {
    const response = await api.post('/auth/admin/login', {
      username,
      password
    });
    
    // 如果响应包含JWT token，存储它们
    if (response.data.accessToken && response.data.refreshToken) {
      TokenManager.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn
      });
    }
    
    return response.data;
  },

  // 管理员登出
  adminLogout: async () => {
    const response = await api.post('/auth/admin/logout');
    // 清除本地存储的token
    TokenManager.clearTokens();
    return response.data;
  }
};

// 管理员API
export const adminApi = {
  // 获取白名单列表（禁用缓存确保数据实时性）
  getPairs: async (keyword = '', page = 1, pageSize = 10, forceRefresh = false) => {
    console.log('getPairs调用，参数:', { keyword, page, pageSize, forceRefresh });
    
    // 添加时间戳防止浏览器缓存
    const timestamp = Date.now();
    const response = await api.get('/admin/pairs', {
      params: { 
        keyword, 
        page, 
        page_size: pageSize,
        _t: timestamp // 防止浏览器缓存
      }
    });

    console.log('getPairs响应:', response.data);
    // 暂时禁用内存缓存，确保数据实时性
    // setCache(cacheKey, response.data, 2 * 60 * 1000);

    return response.data;
  },

  // 创建白名单项
  createPair: async (hospitalName: string, productBatch: string) => {
    const response = await api.post('/admin/pairs', {
      hospital_name: hospitalName,
      product_batch: productBatch
    });
    return response.data;
  },

  // 更新白名单项
  updatePair: async (id: number, data: { hospital_name?: string; product_batch?: string }) => {
    const response = await api.put(`/admin/pairs/${id}`, data);
    return response.data;
  },

  // 删除白名单项
  deletePair: async (id: number) => {
    const response = await api.delete(`/admin/pairs/${id}`);
    return response.data;
  },

  // 导入CSV
  importCSV: async (formData: FormData) => {
    const response = await api.post('/admin/pairs/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // 导出CSV
  exportCSV: () => {
    window.location.href = '/api/admin/pairs/export-csv';
  }
};

// 聊天请求时间戳记录，用于防止短时间内重复发送相同消息
const chatRequestTimestamps = new Map<string, number>();

// 聊天API
export const chatApi = {
  // 发送消息
  sendMessage: async (message: string) => {
    const requestKey = getRequestKey({
      method: 'post',
      url: '/chat/send',
      data: { message }
    });

    // 检查是否有相同的请求正在进行
    const existingRequest = pendingRequests.get(requestKey);
    if (existingRequest) {
      console.log('聊天请求去重 - 相同请求正在处理:', message.substring(0, 50));
      return existingRequest;
    }

    // 检查是否在短时间内发送了相同的消息（防止意外重复点击）
    const now = Date.now();
    const lastRequestTime = chatRequestTimestamps.get(message);
    if (lastRequestTime && (now - lastRequestTime) < 1000) { // 1秒内不允许发送相同消息
      console.log('聊天请求去重 - 短时间内重复消息:', message.substring(0, 50));
      throw new Error('请不要重复发送相同的消息');
    }

    // 记录消息发送时间
    chatRequestTimestamps.set(message, now);

    // 创建新的请求Promise
    const requestPromise = api
      .post('/chat/send', { message })
      .then(response => {
        pendingRequests.delete(requestKey);
        // 清理过期的时间戳记录（保留最近5分钟的记录）
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        for (const [msg, timestamp] of chatRequestTimestamps.entries()) {
          if (timestamp < fiveMinutesAgo) {
            chatRequestTimestamps.delete(msg);
          }
        }
        return response.data;
      })
      .catch(error => {
        pendingRequests.delete(requestKey);
        throw error;
      });

    // 存储请求Promise
    pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }
};
