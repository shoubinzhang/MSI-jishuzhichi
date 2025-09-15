import express from 'express';
import os from 'os';

const router = express.Router();

/**
 * 获取服务器的局域网IP地址
 */
router.get('/ip', (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // 查找局域网IP地址
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      if (networkInterface) {
        for (const network of networkInterface) {
          // 跳过内部地址和IPv6地址
          if (!network.internal && network.family === 'IPv4') {
            // 优先选择192.168.x.x或10.x.x.x或172.16-31.x.x网段的IP
            if (
              network.address.startsWith('192.168.') ||
              network.address.startsWith('10.') ||
              (network.address.startsWith('172.') && 
               parseInt(network.address.split('.')[1]) >= 16 && 
               parseInt(network.address.split('.')[1]) <= 31)
            ) {
              localIP = network.address;
              break;
            }
            // 如果没有找到私有网段IP，使用第一个非内部IPv4地址
            if (localIP === 'localhost') {
              localIP = network.address;
            }
          }
        }
        if (localIP !== 'localhost') break;
      }
    }
    
    res.json({ 
      ip: localIP,
      hostname: os.hostname(),
      platform: os.platform()
    });
  } catch (error) {
    console.error('Error getting network IP:', error);
    res.status(500).json({ 
      error: 'Failed to get network IP',
      ip: 'localhost'
    });
  }
});

export default router;