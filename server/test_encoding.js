const express = require('express');
const app = express();

// 设置字符编码
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 测试路由
app.post('/test-encoding', (req, res) => {
  console.log('收到的请求体:', req.body);
  console.log('医院名称:', req.body.hospital_name);
  console.log('医院名称长度:', req.body.hospital_name?.length);
  console.log('医院名称字节:', Buffer.from(req.body.hospital_name || '', 'utf8'));
  
  res.json({
    received: req.body,
    hospital_name_length: req.body.hospital_name?.length,
    hospital_name_bytes: Buffer.from(req.body.hospital_name || '', 'utf8').toString('hex')
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
});