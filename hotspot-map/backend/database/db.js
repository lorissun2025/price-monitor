/**
 * 数据库连接和查询工具
 * 使用 sql.js（纯 JavaScript，无需编译）
 */

import initSqlJs from 'sql.js';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    // 初始化 sql.js
    const SQL = await initSqlJs();
    dbInstance = new SQL.Database();
    
    // 创建表结构
    createTables(dbInstance);
  }
  return dbInstance;
}

function createTables(db) {
  // 热点表
  db.run(`
    CREATE TABLE IF NOT EXISTS hotspots (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('food', 'travel', 'event', 'acg', 'social')),
      platform TEXT NOT NULL CHECK(platform IN ('xiaohongshu', 'weibo', 'douyin', 'bilibili')),
      source_id TEXT,
      location_name TEXT,
      location_lat REAL,
      location_lng REAL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      influence REAL DEFAULT 0,
      growth REAL DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // 历史数据表
  db.run(`
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
    )
  `);

  // 数据抓取日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS fetch_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'partial')),
      hotspots_fetched INTEGER DEFAULT 0,
      hotspots_new INTEGER DEFAULT 0,
      error_message TEXT,
      timestamp INTEGER NOT NULL
    )
  `);

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_type ON hotspots(type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_platform ON hotspots(platform)');
  db.run('CREATE INDEX IF NOT EXISTS idx_hotspots_influence ON hotspots(influence DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_history_hotspot ON hotspot_history(hotspot_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_history_timestamp ON hotspot_history(timestamp)');
}

// 查询助手
export const db = {
  // 查询单条记录
  get: (sql, params = []) => {
    const db = getDb();
    try {
      return db.exec(sql, params)[0]?.[0] || null;
    } catch (error) {
      console.error('DB query error:', error);
      throw error;
    }
  },

  // 查询多条记录
  all: (sql, params = []) => {
    const db = getDb();
    try {
      const results = db.exec(sql, params);
      return results[0]?.values || [];
    } catch (error) {
      console.error('DB query error:', error);
      throw error;
    }
  },

  // 插入单条记录
  insert: (table, data) => {
    const db = getDb();
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      db.run(sql, values);

      return { success: true };
    } catch (error) {
      console.error('DB insert error:', error);
      throw error;
    }
  },

  // 批量插入
  insertMany: (table, dataArray) => {
    const db = getDb();
    try {
      for (const row of dataArray) {
        db.insert(table, row);
      }
      return { success: true, count: dataArray.length };
    } catch (error) {
      console.error('DB insertMany error:', error);
      throw error;
    }
  },

  // 更新记录
  update: (table, id, data) => {
    const db = getDb();
    try {
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(data), id];

      const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      db.run(sql, values);

      return { success: true };
    } catch (error) {
      console.error('DB update error:', error);
      throw error;
    }
  },

  // 删除记录
  delete: (table, id) => {
    const db = getDb();
    try {
      const sql = `DELETE FROM ${table} WHERE id = ?`;
      db.run(sql, id);

      return { success: true };
    } catch (error) {
      console.error('DB delete error:', error);
      throw error;
    }
  },

  // 执行原生 SQL
  exec: (sql) => {
    const db = getDb();
    try {
      db.exec(sql);
      return { success: true };
    } catch (error) {
      console.error('DB exec error:', error);
      throw error;
    }
  }
};

export default db;
