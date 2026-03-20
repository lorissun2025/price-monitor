require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const hotspotRoutes = require('./routes/hotspots');
const platformRoutes = require('./routes/platforms');
const statsRoutes = require('./routes/stats');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// API 路由
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/stats', statsRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Not Found',
    error: `Route ${req.method} ${req.path} not found`
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 初始化数据库后启动服务
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║                                                  ║
║     🌍 HotSpot Map API Server Started      ║
║                                                  ║
║     Version: 1.1.0                                 ║
║     Port: ${PORT}                                    ║
║     Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                                  ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = app;
