import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../api';
import ThemeToggle from '../components/ThemeToggle';

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    // 安全的preventDefault调用
    if (e.cancelable) {
      e.preventDefault();
    }
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码 / Please enter username and password');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.adminLogin(username, password);
      navigate('/admin/pairs');
    } catch (err: any) {
      setError('用户名或密码错误 / Username or password is incorrect');
      toast.error('用户名或密码错误 / Username or password is incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container'>
      {/* 主题切换按钮 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      
      <div className='card' style={{ maxWidth: '500px', margin: '100px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#333', fontWeight: '600', marginBottom: '4px' }}>管理员登录</h2>
          <h3 style={{ color: '#555', fontWeight: '500', fontSize: '16px', margin: '0' }}>
            Administrator Login
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='username' className='form-label'>
              <span style={{ display: 'block', fontWeight: '600' }}>用户名</span>
              <span
                style={{ display: 'block', fontSize: '13px', color: '#888', fontWeight: '400' }}
              >
                Username
              </span>
            </label>
            <input
              type='text'
              id='username'
              className='form-input'
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='password' className='form-label'>
              <span style={{ display: 'block', fontWeight: '600' }}>密码</span>
              <span
                style={{ display: 'block', fontSize: '13px', color: '#888', fontWeight: '400' }}
              >
                Password
              </span>
            </label>
            <input
              type='password'
              id='password'
              className='form-input'
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && <div className='error-message'>{error}</div>}

          <div className='form-group'>
            <button
              type='submit'
              className='btn btn-primary'
              style={{ width: '100%' }}
              disabled={isLoading}
            >
              {isLoading ? '登录中... / Logging in...' : '登录 / Login'}
            </button>
          </div>
        </form>

        <div className='text-center'>
          <a href='/login'>返回用户登录 / Back to User Login</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
