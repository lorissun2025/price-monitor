const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/hotspots.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_PATH);
  }
});

// 初始化数据库表
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 热点表
      db.run(`
        CREATE TABLE IF NOT EXISTS hotspots (
          id TEXT PRIMARY KEY,
          platform TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          type TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          city TEXT NOT NULL,
          district TEXT NOT NULL,
          address TEXT,
          influence_score REAL NOT NULL,
          influence_level TEXT NOT NULL,
          likes INTEGER DEFAULT 0,
          collects INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          discusses INTEGER DEFAULT 0,
          coins INTEGER DEFAULT 0,
          author TEXT,
          author_id TEXT,
          category TEXT,
          tags TEXT,
          publish_time TEXT NOT NULL,
          fetch_time TEXT NOT NULL,
          url TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create hotspots table:', err.message);
          reject(err);
        } else {
          console.log('✅ Hotspots table created/verified');
        }
      });

      // 趋势数据表
      db.run(`
        CREATE TABLE IF NOT EXISTS hotspot_trends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hotspot_id TEXT NOT NULL,
          score REAL NOT NULL,
          timestamp TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (hotspot_id) REFERENCES hotspots(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create hotspot_trends table:', err.message);
          reject(err);
        } else {
          console.log('✅ Hotspot trends table created/verified');
        }
      });

      // 索引
      db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_platform ON hotspots(platform)');
      db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_type ON hotspots(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_city ON hotspots(city)');
      db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_influence_score ON hotspots(influence_score)');
      db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_publish_time ON hotspots(publish_time)');
      db.run('CREATE INDEX IF NOT EXISTS idx_trends_hotspot_id ON hotspot_trends(hotspot_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_trends_timestamp ON hotspot_trends(timestamp)');

      console.log('✅ Database indexes created/verified');
      resolve();
    });
  });
}

// 数据库查询辅助函数
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = {
  db,
  initDatabase,
  query,
  run,
  get
};
