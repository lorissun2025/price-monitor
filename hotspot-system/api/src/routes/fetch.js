import express from 'express';
import { fetchAllHotspots } from '../services/scraper.js';
import { updateHotspots } from '../services/storage.js';

const router = express.Router();

// 任务状态存储
const taskStatus = new Map();

/**
 * POST /api/fetch
 * 触发数据抓取任务
 */
router.post('/', async (req, res) => {
  try {
    // 生成任务 ID
    const taskId = `fetch_${Date.now()}`;

    // 初始化任务状态
    taskStatus.set(taskId, {
      taskId,
      status: 'running',
      progress: 0,
      platforms: {
        xiaohongshu: 'pending',
        weibo: 'pending',
        douyin: 'pending',
        bilibili: 'pending'
      },
      startTime: new Date().toISOString(),
      estimatedTime: 60, // 预计 60 秒完成
      message: '数据抓取任务已启动'
    });

    // 异步执行抓取
    runFetchTask(taskId);

    res.json({
      success: true,
      message: '数据抓取任务已启动',
      taskId,
      estimatedTime: 60
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '启动抓取任务失败',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/fetch/status/:taskId
 * 获取抓取任务状态
 */
router.get('/status/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = taskStatus.get(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '任务不存在',
          details: `Task ID: ${taskId}`
        }
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取任务状态失败',
        details: error.message
      }
    });
  }
});

/**
 * 执行抓取任务
 */
async function runFetchTask(taskId) {
  const task = taskStatus.get(taskId);

  try {
    // 更新状态：正在抓取
    task.status = 'running';
    task.progress = 10;
    task.message = '正在抓取数据...';

    // 更新平台状态
    const platforms = ['xiaohongshu', 'weibo', 'douyin', 'bilibili'];
    platforms.forEach(p => {
      task.platforms[p] = 'running';
    });

    taskStatus.set(taskId, task);

    // 执行抓取
    const result = await fetchAllHotspots();

    // 更新进度
    task.progress = 80;
    task.message = '正在保存数据...';
    taskStatus.set(taskId, task);

    // 保存数据
    const saveResult = updateHotspots(result.hotspots, {
      keepOld: true,
      maxTotal: 100
    });

    // 更新平台状态为完成
    platforms.forEach(p => {
      task.platforms[p] = result.errors.find(e => e.platform ===
        (p === 'xiaohongshu' ? '小红书' :
         p === 'weibo' ? '微博' :
         p === 'douyin' ? '抖音' : 'B站')
      ) ? 'failed' : 'completed';
    });

    // 任务完成
    task.status = 'completed';
    task.progress = 100;
    task.message = '数据抓取完成';
    task.endTime = new Date().toISOString();
    task.result = {
      total: result.hotspots.length,
      added: saveResult.added,
      kept: saveResult.kept,
      duration: result.duration,
      errors: result.errors
    };

    taskStatus.set(taskId, task);

    console.log(`\n🎉 任务 ${taskId} 完成:`, task.result);

  } catch (error) {
    console.error(`❌ 任务 ${taskId} 失败:`, error);

    // 任务失败
    task.status = 'failed';
    task.progress = 0;
    task.message = `抓取失败: ${error.message}`;
    task.endTime = new Date().toISOString();
    task.error = error.message;

    taskStatus.set(taskId, task);
  }
}

export default router;
