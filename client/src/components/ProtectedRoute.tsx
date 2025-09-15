import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../api';
import TokenManager from '../utils/tokenManager';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 首先检查是否有有效的JWT token
        if (TokenManager.hasValidTokens()) {
          // 如果token即将过期，尝试刷新
          if (TokenManager.isTokenExpiringSoon()) {
            const refreshSuccess = await TokenManager.refreshTokens();
            if (!refreshSuccess) {
              setIsAuthenticated(false);
              return;
            }
          }
          
          // 验证用户信息
          await authApi.getCurrentUser();
          setIsAuthenticated(true);
        } else {
          // 没有有效token，尝试通过session验证
          await authApi.getCurrentUser();
          setIsAuthenticated(true);
        }
      } catch (error) {
        // 认证失败，清除token
        TokenManager.clearTokens();
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // 显示加载状态
  if (isAuthenticated === null) {
    return <Loading size='large' text='正在验证身份...' overlay />;
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // 已认证，显示子组件
  return <>{children}</>;
};

export default ProtectedRoute;
