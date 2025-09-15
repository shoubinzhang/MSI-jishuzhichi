import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
}

interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: Error | string | null) => void;
  clearError: () => void;
  handleAsyncError: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R | null>;
}

/**
 * 错误处理Hook
 * 提供统一的错误处理、显示和清除功能
 */
const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: ''
  });

  const setError = useCallback((error: Error | string | null) => {
    if (!error) {
      setErrorState({
        error: null,
        isError: false,
        errorMessage: ''
      });
      return;
    }

    const errorObj = error instanceof Error ? error : new Error(error);
    const message = getErrorMessage(errorObj);
    
    setErrorState({
      error: errorObj,
      isError: true,
      errorMessage: message
    });

    // 显示toast通知
    toast.error(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: ''
    });
  }, []);

  const handleAsyncError = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setError, clearError]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | null> => {
      return handleAsyncError(() => fn(...args));
    };
  }, [handleAsyncError]);

  return {
    ...errorState,
    setError,
    clearError,
    handleAsyncError,
    withErrorHandling
  };
};

/**
 * 从错误对象中提取用户友好的错误消息
 */
function getErrorMessage(error: any): string {
  // API错误响应
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // 网络错误
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return '网络连接失败，请检查网络设置';
  }

  // 超时错误
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return '请求超时，请稍后重试';
  }

  // 401 未授权
  if (error?.response?.status === 401) {
    return '身份验证失败，请重新登录';
  }

  // 403 禁止访问
  if (error?.response?.status === 403) {
    return '没有权限访问此资源';
  }

  // 404 未找到
  if (error?.response?.status === 404) {
    return '请求的资源不存在';
  }

  // 500 服务器错误
  if (error?.response?.status >= 500) {
    return '服务器内部错误，请稍后重试';
  }

  // 默认错误消息
  return error?.message || '发生了未知错误，请重试';
}

/**
 * 重试Hook
 * 提供重试功能和重试状态管理
 */
export const useRetry = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> => {
    setIsRetrying(true);
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await asyncFn();
        setRetryCount(i);
        setIsRetrying(false);
        return result;
      } catch (error) {
        setRetryCount(i + 1);
        
        if (i === maxRetries) {
          setIsRetrying(false);
          throw error;
        }
        
        // 等待指定时间后重试
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    setIsRetrying(false);
    return null;
  }, []);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    resetRetry
  };
};

/**
 * 全局错误处理器
 * 用于处理未捕获的Promise rejection和其他全局错误
 */
export const setupGlobalErrorHandlers = () => {
  // 处理未捕获的Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    toast.error('发生了未处理的错误');
    // 使用更安全的方式阻止默认行为
    if (event.cancelable) {
      event.preventDefault();
    }
  }, { passive: false });

  // 处理全局JavaScript错误
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    toast.error('应用程序发生错误');
  });
};

/**
 * 错误类型定义
 */
export class AppError extends Error {
  public code: string;
  public statusCode?: number;
  public isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 常见错误类型
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

export default useErrorHandler;
export { useErrorHandler };