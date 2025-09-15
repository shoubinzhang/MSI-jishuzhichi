import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../api';
import promegaLogo from '../assets/promega-logo.svg';
import ThemeToggle from '../components/ThemeToggle';
import QRCodeGenerator from '../components/QRCodeGenerator';

const LoginPage = () => {
  const [hospitalName, setHospitalName] = useState('');
  const [productBatch, setProductBatch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileAccessExpanded, setIsMobileAccessExpanded] = useState(false);
  const navigate = useNavigate();



  const handleSubmit = async (e: FormEvent) => {
    // 安全的preventDefault调用
    if (e.cancelable) {
      e.preventDefault();
    }
    setError('');

    // 验证输入
    if (!hospitalName.trim()) {
      setError('请输入医院名称 / Please enter hospital name');
      return;
    }

    if (!productBatch.trim()) {
      setError('请输入产品批号 / Please enter product batch number');
      return;
    }

    // 验证产品批号格式
    const batchRegex = /^[A-Za-z0-9-]{6,32}$/;
    if (!batchRegex.test(productBatch)) {
      setError(
        '产品批号格式不正确，应为6-32位字母、数字或连字符 / Invalid product batch format, should be 6-32 characters of letters, numbers or hyphens'
      );
      return;
    }

    setIsLoading(true);

    try {
      await authApi.login(hospitalName, productBatch);
      navigate('/chat');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        '登录失败，请检查医院名称和产品批号 / Login failed, please check hospital name and product batch number';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mobile-safe-area mobile-text'>
      {/* 主题切换按钮 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      
      <div
        className='card login-card mobile-friendly'
        style={{ maxWidth: '500px', margin: '80px auto', padding: '40px' }}
      >
        <div className='login-header'>
          <img src={promegaLogo} alt='Promega Logo' style={{ marginBottom: '30px' }} />
        </div>

        <form onSubmit={handleSubmit} role='form' aria-label='医院登录表单 Hospital Login Form'>

            <div className='form-group'>
              <label htmlFor='hospitalName' className='form-label'>
                <span style={{ display: 'block', fontWeight: '600' }}>医院名称</span>
                <span
                  style={{ display: 'block', fontSize: '13px', color: '#888', fontWeight: '400' }}
                >
                  Hospital Name
                </span>
              </label>
              <input
                type='text'
                id='hospitalName'
                className='form-input mobile-input mobile-friendly'
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                disabled={isLoading}
                required
                aria-describedby='hospitalName-error'
                aria-invalid={error ? 'true' : 'false'}
                autoComplete='organization'
              />
            </div>

          <div className='form-group'>
            <label htmlFor='productBatch' className='form-label'>
              <span style={{ display: 'block', fontWeight: '600' }}>产品批号</span>
              <span
                style={{ display: 'block', fontSize: '13px', color: '#888', fontWeight: '400' }}
              >
                Product Batch Number
              </span>
            </label>
            <input
              type='text'
              id='productBatch'
              className='form-input mobile-input mobile-friendly'
              value={productBatch}
              onChange={e => setProductBatch(e.target.value)}
              disabled={isLoading}
              placeholder=''
              required
              aria-describedby='productBatch-hint productBatch-error'
              aria-invalid={error ? 'true' : 'false'}
              autoComplete='off'
            />
            <div id='productBatch-hint' className='form-hint'>
              <span style={{ fontSize: '12px', color: '#888' }}>💡 10位数字 (10 digits)</span>
            </div>
          </div>

          {error && (
            <div
              id='hospitalName-error productBatch-error'
              className='error-message'
              role='alert'
              aria-live='polite'
            >
              {error}
            </div>
          )}

          <div className='form-group'>
            <button
              type='submit'
              className='btn btn-primary mobile-button mobile-friendly'
              style={{ width: '100%' }}
              disabled={isLoading}
              aria-describedby={isLoading ? 'loading-status' : undefined}
            >
              {isLoading ? '登录中... / Logging in...' : '登录 / Login'}
            </button>
          </div>

          {isLoading && (
            <div id='loading-status' className='sr-only' aria-live='polite'>
              正在处理登录请求，请稍候 / Processing login request, please wait
            </div>
          )}
        </form>



        {/* 手机访问按钮 */}
        <div style={{ margin: '30px 0' }}>
          {!isMobileAccessExpanded ? (
            <button
              type='button'
              className='mobile-access-toggle-btn'
              onClick={() => setIsMobileAccessExpanded(true)}
            >
              <span className='mobile-access-icon'>📱</span>
              <span className='mobile-access-text'>
                <span style={{ display: 'block', fontWeight: '600' }}>手机访问</span>
                <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>Mobile Access</span>
              </span>
              <span className='mobile-access-arrow'>▼</span>
            </button>
          ) : (
            <div className='mobile-access-expanded'>
              {/* 收起按钮 */}
              <div className='mobile-access-header'>
                <button
                  type='button'
                  className='mobile-access-close-btn'
                  onClick={() => setIsMobileAccessExpanded(false)}
                >
                  <span>收起二维码</span>
                  <span className='mobile-access-close-arrow'>▲</span>
                </button>
              </div>
              
              {/* 手机访问二维码 */}
              <div style={{ marginTop: '20px' }}>
                <QRCodeGenerator 
                  url={window.location.origin}
                  size={180}
                  className="mobile-friendly"
                  showUrl={true}
                />
              </div>
            </div>
          )}
        </div>

        <div className='text-center' style={{ marginTop: '20px' }}>
          <a href='/admin/login'>管理员登录 / Admin Login</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
