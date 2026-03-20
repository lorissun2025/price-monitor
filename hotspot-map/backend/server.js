/**
 * 热点地图后端服务器
 * Express + SQLite + 数据抓取 + 趋势分析
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// API 路由
import hotspotRoutes from './api/hotspots.js';
import statsRoutes from './api/stats.js';

// 服务
import { initializeDatabase } from './database/init.js';

// 中间件
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于前端）
app.use(express.static(path.join(__dirname, '../')));

// API 路由
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.1.0',
    timestamp: Date.now()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 热点地图后端服务器启动成功`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🕐 启动时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
});

export default app;
