/**
 * 请求日志中间件
 * 记录每个 HTTP 请求的信息：方法、路径、状态码、耗时
 */

const Logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 记录请求开始（仅在 debug 级别）
  Logger.debug(`📥 收到请求: ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // 监听响应完成
  res.on('finish', () => {
    const elapsed = Date.now() - startTime;
    Logger.request(req.method, req.path, res.statusCode, elapsed);

    // 记录慢请求（> 1秒）
    if (elapsed > 1000) {
      Logger.warn(`⚠️ 慢请求: ${req.method} ${req.path}`, { elapsed: `${elapsed}ms` });
    }
  });

  next();
}

module.exports = requestLogger;
