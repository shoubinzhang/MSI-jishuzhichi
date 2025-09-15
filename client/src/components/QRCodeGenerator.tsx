import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  className?: string;
  showUrl?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  url, 
  size = 200, 
  className = '', 
  showUrl = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !url) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        setError('生成二维码失败');
        console.error('QR Code generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [url, size]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // 可以添加提示消息
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className={`qr-code-container ${className}`}>
      <div className="qr-code-wrapper">
        {isLoading && (
          <div className="qr-loading">
            <div className="loading-spinner"></div>
            <span>生成二维码中...</span>
          </div>
        )}
        
        {error && (
          <div className="qr-error">
            <span>❌ {error}</span>
          </div>
        )}
        
        <canvas 
          ref={canvasRef} 
          style={{ display: isLoading || error ? 'none' : 'block' }}
          className="qr-canvas"
        />
      </div>
      
      {showUrl && !isLoading && !error && (
        <div className="qr-url-info">
          <p className="qr-url-text">{url}</p>
          <button 
            onClick={copyToClipboard}
            className="qr-copy-btn"
            title="复制链接"
          >
            📋 复制链接
          </button>
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="qr-instructions">
          <p>📱 使用手机扫描二维码即可访问</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;