import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Loading from './components/Loading';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/theme.css';

// 懒加载页面组件
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminPairsPage = lazy(() => import('./pages/AdminPairsPage'));

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path='/' element={<Navigate to='/login' replace />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/admin/login' element={<AdminLoginPage />} />

            {/* 受保护的用户路由 */}
            <Route
              path='/chat'
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            {/* 管理员根路径重定向 */}
            <Route path='/admin' element={<Navigate to='/admin/login' replace />} />

            {/* 受保护的管理员路由 */}
            <Route
              path='/admin/pairs'
              element={
                <AdminRoute>
                  <AdminPairsPage />
                </AdminRoute>
              }
            />

            {/* 404页面 */}
            <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
