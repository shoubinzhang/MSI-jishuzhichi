import React, { useState, useEffect } from 'react';
import { Card, Spin, message, Button, Space, Typography } from 'antd';
import { QrcodeOutlined, ReloadOutlined, WechatOutlined } from '@ant-design/icons';
import { generateLoginUrl, isWechatBrowser, isMobileDevice } from '../utils/urlParams';

const { Text } = Typography;

interface QRCodeLoginProps {
  hospitalName?: string;
  productBatch?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  size?: number;
}

const QRCodeLogin: React.FC<QRCodeLoginProps> = ({
  hospitalName,
  productBatch,
  onSuccess,
  onError,
  size = 200
}) => {
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [appUrl, setAppUrl] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // 生成二维码
  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (hospitalName) params.append('hospital_name', hospitalName);
      if (productBatch) params.append('product_batch', productBatch);
      params.append('size', size.toString());
      params.append('_t', Date.now().toString()); // 防止缓存
      
      const qrUrl = `/api/qrcode/generate?${params.toString()}`;
      setQrCodeUrl(qrUrl);
      
      // 获取二维码信息
      const infoResponse = await fetch(`/api/qrcode/info?${params.toString()}`);
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        setAppUrl(infoData.qr_url);
      }
      
    } catch (error) {
      const errorMsg = '生成二维码失败';
      message.error(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 刷新二维码
  const refreshQRCode = () => {
    setRefreshKey(prev => prev + 1);
    generateQRCode();
  };

  // 生成登录链接
  const generateLoginLink = () => {
    if (!hospitalName || !productBatch) {
      return window.location.origin;
    }
    
    return generateLoginUrl(hospitalName, productBatch);
  };

  // 复制链接
  const copyLink = async () => {
    try {
      const linkToCopy = appUrl || generateLoginLink();
      await navigator.clipboard.writeText(linkToCopy);
      message.success('链接已复制到剪贴板');
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };



  // 处理URL参数（扫码后的自动登录）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromQrcode = urlParams.get('from_qrcode');
    const hospitalParam = urlParams.get('hospital_name');
    const batchParam = urlParams.get('product_batch');
    
    if (fromQrcode === 'true' && hospitalParam && batchParam) {
      // 扫码进入，自动填充登录信息
      message.success('扫码成功，正在自动登录...');
      onSuccess?.({
        hospital_name: hospitalParam,
        product_batch: batchParam,
        from_qrcode: true
      });
    }
  }, [onSuccess]);

  useEffect(() => {
    generateQRCode();
  }, [hospitalName, productBatch, size, refreshKey]);

  return (
    <Card 
      title={
        <Space>
          <QrcodeOutlined style={{ color: '#1890ff' }} />
          <span>微信扫码登录</span>
        </Space>
      }
      style={{ width: '100%', maxWidth: 320 }}
      actions={[
        <Button 
          key="refresh" 
          type="text" 
          icon={<ReloadOutlined />} 
          onClick={refreshQRCode}
          loading={loading}
        >
          刷新
        </Button>,
        <Button 
          key="copy" 
          type="text" 
          onClick={copyLink}
          disabled={!appUrl}
        >
          复制链接
        </Button>
      ]}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        {loading ? (
          <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div>
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="登录二维码" 
                style={{ 
                  width: size, 
                  height: size, 
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px'
                }}
                onError={() => {
                  message.error('二维码加载失败');
                  onError?.('二维码加载失败');
                }}
              />
            )}
          </div>
        )}
        
        <div style={{ marginTop: '16px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* 移动端优化提示 */}
            {isMobileDevice() && !isWechatBrowser() && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '6px',
                marginBottom: '8px'
              }}>
                <Text style={{ fontSize: '11px', color: '#d46b08' }}>
                  💡 提示：在微信中打开效果更佳 / Better experience in WeChat
                </Text>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WechatOutlined style={{ color: '#07c160', marginRight: '4px' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                使用微信扫码
              </Text>
            </div>
            
            {isWechatBrowser() ? (
              <Text type="warning" style={{ fontSize: '11px' }}>
                请长按识别二维码 / Long press to scan QR code
              </Text>
            ) : isMobileDevice() ? (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                请使用微信扫一扫功能 / Use WeChat scan function
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                请使用手机微信扫码 / Scan with WeChat on mobile
              </Text>
            )}
            
            {hospitalName && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                医院：{hospitalName}
              </Text>
            )}
            
            {productBatch && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                批号：{productBatch}
              </Text>
            )}
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default QRCodeLogin;