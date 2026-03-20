import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（数据文件）
app.use('/data', express.static(join(__dirname, '../data')));

// 导入路由
import hotspotsRouter from './routes/hotspots.js';
import statsRouter from './routes/stats.js';
import fetchRouter from './routes/fetch.js';

// 注册路由
app.use('/api/hotspots', hotspotsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/fetch', fetchRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '热点地图 API 运行正常',
    timestamp: new Date().toISOString()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '热点地图 API v1.0',
    docs: '/api/docs',
    endpoints: {
      hotspots: '/api/hotspots',
      stats: '/api/stats',
      fetch: '/api/fetch'
    }
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '接口不存在',
      path: req.path
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      details: err.message
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 热点地图 API 启动成功！`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📊 API 文档: http://localhost:${PORT}/api/docs`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`\n⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
});
