/**
 * 数据库初始化脚本
 * 创建数据库表和初始数据
 * 使用 sql.js（纯 JS，无需编译）
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, 'hotspot-map.db');

console.log('📊 开始初始化数据库...');
console.log(`📁 数据库路径: ${dbPath}`);

// 删除旧数据库（开发环境）
if (fs.existsSync(dbPath)) {
  console.log('🗑️  删除旧数据库...');
  fs.unlinkSync(dbPath);
}

// 初始化 sql.js
const SQL = await initSqlJs();
const db = new SQL.Database();

// 读取并执行 SQL 脚本
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

try {
  // 执行 SQL
  db.run(schema);
  console.log('✅ 数据库表创建成功');
} catch (error) {
  console.error('❌ 数据库初始化失败:', error);
  process.exit(1);
}

// 插入一些测试数据
const insertHotspot = db.prepare(`
  INSERT INTO hotspots (
    id, title, description, type, platform, source_id,
    location_name, location_lat, location_lng,
    views, likes, comments, shares, influence, growth,
    created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?
  )
`);

const testHotspots = [
  {
    id: 'test_001',
    title: '三里屯太古里网红打卡地',
    description: '北京最火的购物和娱乐中心，汇集众多时尚品牌和美食',
    type: 'travel',
    platform: 'xiaohongshu',
    source_id: 'xhs_001',
    location_name: '北京三里屯',
    location_lat: 39.9373,
    location_lng: 116.4479,
    views: 125000,
    likes: 8900,
    comments: 1200,
    shares: 3400,
    influence: 0.85,
    growth: 15.3
  },
  {
    id: 'test_002',
    title: '上海外滩夜景拍照指南',
    description: '外滩最佳拍照位置和时间推荐',
    type: 'travel',
    platform: 'xiaohongshu',
    source_id: 'xhs_002',
    location_name: '上海外滩',
    location_lat: 31.2397,
    location_lng: 121.4944,
    views: 89000,
    likes: 6700,
    comments: 890,
    shares: 2100,
    influence: 0.78,
    growth: 12.5
  },
  {
    id: 'test_003',
    title: '成都春熙路美食探店',
    description: '春熙路周边必吃美食推荐',
    type: 'food',
    platform: 'douyin',
    source_id: 'dy_001',
    location_name: '成都春熙路',
    location_lat: 30.6586,
    location_lng: 104.0836,
    views: 156000,
    likes: 12300,
    comments: 1800,
    shares: 5600,
    influence: 0.82,
    growth: 18.7
  },
  {
    id: 'test_004',
    title: '广州漫展2026春季展',
    description: '大型动漫游戏展览，众多知名Coser和IP参展',
    type: 'acg',
    platform: 'bilibili',
    source_id: 'bili_001',
    location_name: '广州琶洲会展中心',
    location_lat: 23.1039,
    location_lng: 113.3639,
    views: 234000,
    likes: 18900,
    comments: 2500,
    shares: 7800,
    influence: 0.91,
    growth: 22.4
  }
];

console.log('📝 插入测试数据...');
for (const hotspot of testHotspots) {
  const now = Math.floor(Date.now() / 1000);
  insertHotspot.run(
    hotspot.id,
    hotspot.title,
    hotspot.description,
    hotspot.type,
    hotspot.platform,
    hotspot.source_id,
    hotspot.location_name,
    hotspot.location_lat,
    hotspot.location_lng,
    hotspot.views,
    hotspot.likes,
    hotspot.comments,
    hotspot.shares,
    hotspot.influence,
    hotspot.growth,
    now,
    now
  );
  console.log(`  ✅ ${hotspot.title}`);
}

// 为每个测试热点添加历史数据
const insertHistory = db.prepare(`
  INSERT INTO hotspot_history (hotspot_id, timestamp, views, likes, comments, shares, influence)
  VALUES (?, ?, ?, ?, ?, ?)
`);

console.log('📈 插入历史数据...');
const now = Math.floor(Date.now() / 1000);
const dayInSeconds = 24 * 60 * 60;

for (const hotspot of testHotspots) {
  for (let i = 7; i >= 0; i--) {
    const timestamp = now - (i * dayInSeconds);
    // 模拟历史数据（逐渐增长）
    const factor = 1 - (i * 0.1);
    insertHistory.run(
      hotspot.id,
      timestamp,
      Math.floor(hotspot.views * factor),
      Math.floor(hotspot.likes * factor),
      Math.floor(hotspot.comments * factor),
      Math.floor(hotspot.shares * factor),
      parseFloat((hotspot.influence * factor).toFixed(2))
    );
  }
}

// 查询验证
const hotspotsCount = db.exec('SELECT COUNT(*) as count FROM hotspots')[0].values[0][0];
const historyCount = db.exec('SELECT COUNT(*) as count FROM hotspot_history')[0].values[0][0];

console.log(`\n✨ 数据库初始化完成！`);
console.log(`📊 热点数量: ${hotspotsCount}`);
console.log(`📈 历史记录: ${historyCount}`);
