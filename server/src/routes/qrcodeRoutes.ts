import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';

const router = Router();

/**
 * 生成二维码接口
 * 支持生成包含应用链接的二维码，用户扫码后可直接打开应用
 */
router.get('/generate', async (req: Request, res: Response) => {
  try {
    const { 
      hospital_name, 
      product_batch, 
      redirect_url,
      size = 200,
      format = 'png'
    } = req.query as {
      hospital_name?: string;
      product_batch?: string;
      redirect_url?: string;
      size?: string;
      format?: 'png' | 'svg';
    };

    // 构建应用链接
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    let appUrl = baseUrl;

    // 添加参数
    const params = new URLSearchParams();
    if (hospital_name) params.append('hospital_name', hospital_name);
    if (product_batch) params.append('product_batch', product_batch);
    if (redirect_url) params.append('redirect_url', redirect_url);
    
    // 添加扫码标识
    params.append('from_qrcode', 'true');
    params.append('timestamp', Date.now().toString());

    if (params.toString()) {
      appUrl += '?' + params.toString();
    }

    console.log('生成二维码，目标URL:', appUrl);

    // 生成二维码配置
    const qrOptions = {
      width: parseInt(size.toString()),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    };

    if (format === 'svg') {
      // 生成SVG格式二维码
      const qrSvg = await QRCode.toString(appUrl, {
        ...qrOptions,
        type: 'svg'
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrSvg);
    } else {
      // 生成PNG格式二维码
      const qrBuffer = await QRCode.toBuffer(appUrl, {
        ...qrOptions,
        type: 'png'
      });
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 缓存5分钟
      res.send(qrBuffer);
    }

  } catch (error) {
    console.error('生成二维码失败:', error);
    res.status(500).json({ 
      error: '生成二维码失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取二维码信息接口
 * 返回二维码包含的URL信息，用于调试
 */
router.get('/info', (req: Request, res: Response) => {
  try {
    const { 
      hospital_name, 
      product_batch, 
      redirect_url
    } = req.query as {
      hospital_name?: string;
      product_batch?: string;
      redirect_url?: string;
    };

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    let appUrl = baseUrl;

    const params = new URLSearchParams();
    if (hospital_name) params.append('hospital_name', hospital_name);
    if (product_batch) params.append('product_batch', product_batch);
    if (redirect_url) params.append('redirect_url', redirect_url);
    params.append('from_qrcode', 'true');
    params.append('timestamp', Date.now().toString());

    if (params.toString()) {
      appUrl += '?' + params.toString();
    }

    res.json({
      qr_url: appUrl,
      parameters: {
        hospital_name,
        product_batch,
        redirect_url,
        from_qrcode: true,
        timestamp: Date.now()
      },
      usage: {
        png: `/api/qrcode/generate?${params.toString()}`,
        svg: `/api/qrcode/generate?${params.toString()}&format=svg`,
        custom_size: `/api/qrcode/generate?${params.toString()}&size=300`
      }
    });

  } catch (error) {
    console.error('获取二维码信息失败:', error);
    res.status(500).json({ 
      error: '获取二维码信息失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;