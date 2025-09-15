import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setupGlobalErrorHandlers } from './hooks/useErrorHandler';
import { initNetworkIP } from './utils/networkUtils';

// 修复被动事件监听器警告
// 移除全局addEventListener重写，避免与React事件系统冲突
// React的合成事件系统会自动处理大部分情况

// 设置全局错误处理
setupGlobalErrorHandlers();

// 初始化网络IP地址
initNetworkIP().catch(console.warn);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer position='top-right' autoClose={3000} />
    </BrowserRouter>
  </React.StrictMode>
);
