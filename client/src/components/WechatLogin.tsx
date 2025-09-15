import React, { useEffect, useState } from 'react';
import { Button, Spin, message } from 'antd';
import { WechatOutlined } from '@ant-design/icons';

interface WechatUser {
  openid: string;
  nickname: string;
  headimgurl: string;
}

interface WechatLoginProps {
  onSuccess?: (user: WechatUser) => void;
  onError?: (error: string) => void;
}

const WechatLogin: React.FC<WechatLoginProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<WechatUser | null>(null);

  useEffect(() => {
    // 检查URL参数，处理微信授权回调
    const urlParams = new URLSearchParams(window.location.search);
    const wechatAuth = urlParams.get('wechat_auth');
    const errorMessage = urlParams.get('message');

    if (wechatAuth === 'success') {
      // 授权成功，获取用户信息
      fetchUserInfo();
      // 清理URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (wechatAuth === 'error') {
      const error = errorMessage ? decodeURIComponent(errorMessage) : '微信授权失败';
      message.error(error);
      onError?.(error);
    }

    // 页面加载时检查是否已经授权
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/wechat/user', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        onSuccess?.(userData);
      }
    } catch (error) {
      console.log('未授权或授权已过期');
    }
  };

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wechat/user', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        message.success('微信授权成功！');
        onSuccess?.(userData);
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (error) {
      const errorMsg = '获取用户信息失败';
      message.error(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    try {
      setLoading(true);

      // 获取当前页面URL作为回调地址
      const redirectUri = window.location.origin + window.location.pathname;

      // 获取微信授权URL
      const response = await fetch(
        `/api/wechat/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}&state=login`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        // 跳转到微信授权页面
        window.location.href = data.authUrl;
      } else {
        throw new Error('获取授权URL失败');
      }
    } catch (error) {
      const errorMsg = '微信登录失败，请重试';
      message.error(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/wechat/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        message.success('已退出微信登录');
      }
    } catch (error) {
      message.error('退出失败');
    }
  };

  if (user) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <img
            src={user.headimgurl}
            alt='头像'
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              marginBottom: '8px'
            }}
          />
          <div>欢迎，{user.nickname}</div>
        </div>
        <Button onClick={handleLogout} size='small'>
          退出微信登录
        </Button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <Spin spinning={loading}>
        <Button
          type='primary'
          icon={<WechatOutlined />}
          onClick={handleWechatLogin}
          style={{
            backgroundColor: '#07c160',
            borderColor: '#07c160',
            width: '200px',
            height: '40px'
          }}
          disabled={loading}
        >
          {loading ? '授权中...' : '微信登录'}
        </Button>
      </Spin>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
        点击授权后将跳转到微信进行身份验证
      </div>
    </div>
  );
};

export default WechatLogin;
