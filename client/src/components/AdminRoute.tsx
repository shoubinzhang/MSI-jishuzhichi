import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from '../api';
import TokenManager from '../utils/tokenManager';
import Loading from './Loading';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // 首先检查是否有有效的JWT token
        if (TokenManager.hasValidTokens()) {
          // 如果token即将过期，尝试刷新
          if (TokenManager.isTokenExpiringSoon()) {
            const refreshSuccess = await TokenManager.refreshTokens();
            if (!refreshSuccess) {
              setIsAdmin(false);
              return;
            }
          }
        }
        
        // 尝试访问一个需要管理员权限的API
        await adminApi.getPairs('', 1, 1);
        setIsAdmin(true);
      } catch (error) {
        // 认证失败，清除token
        TokenManager.clearTokens();
        setIsAdmin(false);
      }
    };

    checkAdminAuth();
  }, []);

  // 显示加载状态
  if (isAdmin === null) {
    return <Loading size='large' text='正在验证管理员权限...' overlay />;
  }

  // 如果不是管理员，重定向到管理员登录页
  if (!isAdmin) {
    return <Navigate to='/admin/login' replace />;
  }

  // 是管理员，显示子组件
  return <>{children}</>;
};

export default AdminRoute;
