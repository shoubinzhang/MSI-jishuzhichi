/**
 * 网络工具函数
 */

// 缓存的网络IP地址
let cachedNetworkIP: string | null = null;

/**
 * 从服务器获取局域网IP地址
 */
const fetchNetworkIPFromServer = async (): Promise<string> => {
  try {
    const response = await fetch('/api/network/ip');
    if (response.ok) {
      const data = await response.json();
      return data.ip || window.location.hostname;
    }
  } catch (error) {
    console.warn('Failed to fetch network IP from server:', error);
  }
  return window.location.hostname;
};

/**
 * 获取局域网IP地址
 * 在开发环境中，尝试获取本机的局域网IP地址
 * 在生产环境中，使用当前域名
 */
export const getNetworkIP = (): string => {
  // 在生产环境中，直接使用当前hostname
  if (process.env.NODE_ENV === 'production') {
    return window.location.hostname;
  }
  
  // 在开发环境中，尝试获取局域网IP
  const hostname = window.location.hostname;
  
  // 如果已经是IP地址，直接返回
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname;
  }
  
  // 如果是localhost，使用缓存的IP或默认IP
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 返回缓存的IP或默认IP
    return cachedNetworkIP || '172.30.81.103';
  }
  
  return hostname;
};

/**
 * 异步获取并缓存网络IP地址
 */
export const initNetworkIP = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      cachedNetworkIP = await fetchNetworkIPFromServer();
    }
  }
};

/**
 * 获取完整的服务器URL
 */
export const getServerURL = (port: number = 5000): string => {
  const ip = getNetworkIP();
  return `http://${ip}:${port}`;
};