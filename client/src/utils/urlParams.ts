/**
 * URL参数处理工具
 * 用于处理微信扫码后的参数解析和自动登录
 */

import { getServerURL } from './networkUtils';

// 解析URL参数
export const parseUrlParams = (): { hospitalName?: string; productBatch?: string } => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    hospitalName: urlParams.get('hospital') || undefined,
    productBatch: urlParams.get('batch') || undefined,
  };
};

// 检测是否为微信内置浏览器
export const isWechatBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

// 检测是否为移动设备
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 清除URL参数（登录成功后清理URL）
export const clearUrlParams = (): void => {
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, document.title, url.toString());
};

// 生成带参数的登录链接
export const generateLoginUrl = (hospitalName: string, productBatch: string): string => {
  const baseUrl = getServerURL(5000);
  const params = new URLSearchParams({
    hospital: hospitalName,
    batch: productBatch,
  });
  return `${baseUrl}?${params.toString()}`;
};