-- 热点地图数据库模式
-- 版本: v1.1
-- 说明: 存储热点数据和时序趋势信息

-- 热点表
CREATE TABLE IF NOT EXISTS hotspots (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('food', 'travel', 'event', 'acg', 'social')),
  platform TEXT NOT NULL CHECK(platform IN ('xiaohongshu', 'weibo', 'douyin', 'bilibili')),
  source_id TEXT,  -- 原平台ID，用于去重

  -- 位置信息
  location_name TEXT,
  location_lat REAL,
  location_lng REAL,

  -- 互动数据
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  -- 分析数据
  influence REAL DEFAULT 0 CHECK(influence >= 0 AND influence <= 1),
  growth REAL DEFAULT 0,  -- 增长率 (%)

  -- 时间戳
  created_at INTEGER,
  updated_at INTEGER
);

-- 历史数据表（用于趋势分析）
CREATE TABLE IF NOT EXISTS hotspot_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotspot_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  influence REAL DEFAULT 0,
  FOREIGN KEY (hotspot_id) REFERENCES hotspots(id) ON DELETE CASCADE
);

-- 数据抓取日志表
CREATE TABLE IF NOT EXISTS fetch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'partial')),
  hotspots_fetched INTEGER DEFAULT 0,
  hotspots_new INTEGER DEFAULT 0,
  error_message TEXT,
  timestamp INTEGER NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_hotspots_type ON hotspots(type);
CREATE INDEX IF NOT EXISTS idx_hotspots_platform ON hotspots(platform);
CREATE INDEX IF NOT EXISTS idx_hotspots_influence ON hotspots(influence DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_created_at ON hotspots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_hotspot ON hotspot_history(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON hotspot_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_hotspot_timestamp ON hotspot_history(hotspot_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_platform ON fetch_logs(platform);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_timestamp ON fetch_logs(timestamp DESC);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_hotspot_timestamp
AFTER UPDATE ON hotspots
BEGIN
  UPDATE hotspots SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;
