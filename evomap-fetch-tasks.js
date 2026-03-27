#!/usr/bin/env node

/**
 * EvoMap 任务查询脚本 v4
 * 使用正确的 GEP-A2A 协议信封格式
 */

const https = require('https');
const crypto = require('crypto');

// 配置
const CONFIG = {
  // 当前活跃节点
  nodeId: 'node_1914f117',
  nodeSecret: '4be392f1102a7e254e0a40738125b5b0a48fb9d8e463cca6591522fa374455db',

  // EvoMap API 端点
  apiEndpoint: 'https://evomap.ai/a2a',

  // 任务过滤条件
  minReputation: 50,  // 最小声望要求
  taskLimit: 10,     // 最大尝试接取的任务数
};

/**
 * 生成唯一的 message_id
 */
function generateMessageId() {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  return `msg_${timestamp}_${randomHex}`;
}

/**
 * 生成 ISO 8601 UTC 时间戳
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * 创建 GEP-A2A 协议信封
 */
function createEnvelope(messageType, payload) {
  return {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: messageType,
    message_id: generateMessageId(),
    sender_id: CONFIG.nodeId,
    timestamp: getTimestamp(),
    payload: payload,
  };
}

/**
 * 发送 POST 请求到 EvoMap API
 */
async function postToEvoMap(endpoint, messageType, payload) {
  return new Promise((resolve, reject) => {
    const envelope = createEnvelope(messageType, payload);
    const data = JSON.stringify(envelope);

    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        // 先打印原始响应（调试用）
        if (responseData.includes('<!DOCTYPE')) {
          console.log(`⚠️  收到 HTML 响应，端点: ${endpoint}`);
          console.log(`   前200字符: ${responseData.substring(0, 200)}...`);
          reject(new Error(`收到 HTML 响应而不是 JSON`));
          return;
        }

        try {
          const result = JSON.parse(responseData);

          // 检查是否是协议错误
          if (result.error === 'invalid_protocol_message') {
            reject(new Error(`协议错误: ${JSON.stringify(result.correction)}`));
            return;
          }

          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(result);
          } else {
            reject(new Error(`API 返回错误: ${res.statusCode} - ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}\n原始响应: ${responseData.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * 刷新节点 secret（使用 /a2a/hello）
 */
async function refreshNodeSecret() {
  console.log('🔄 正在刷新节点 secret...');

  const payload = {
    secret: CONFIG.nodeSecret,
    action: 'rotate_secret',
  };

  try {
    const result = await postToEvoMap('/hello', 'hello', payload);
    const newSecret = result.payload.secret;

    if (!newSecret) {
      throw new Error('未返回新的 secret');
    }

    CONFIG.nodeSecret = newSecret;
    console.log(`✅ 刷新成功！新 secret: ${newSecret.substring(0, 20)}...`);
    if (result.payload.credits) {
      console.log(`   节点积分: ${result.payload.credits} USDC`);
    }
    if (result.payload.reputation) {
      console.log(`   节点声望: ${result.payload.reputation} (Level ${result.payload.level || 'N/A'})`);
    }

    return result;
  } catch (error) {
    console.error(`❌ 刷新 secret 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 查询可用任务（使用 /a2a/discover）
 */
async function discoverTasks() {
  console.log('\n🔍 正在查询可用任务...');

  const payload = {
    secret: CONFIG.nodeSecret,
  };

  try {
    const result = await postToEvoMap('/discover', 'discover', payload);

    if (!result.payload.tasks || !Array.isArray(result.payload.tasks)) {
      throw new Error('未返回任务列表');
    }

    const tasks = result.payload.tasks;
    console.log(`\n📋 查询到 ${tasks.length} 个任务`);

    return tasks;
  } catch (error) {
    console.error(`❌ 查询任务失败: ${error.message}`);
    throw error;
  }
}

/**
 * 按优先级排序任务
 */
function sortTasks(tasks) {
  console.log('\n📊 正在按优先级排序任务...');

  // 第一优先级：relevance > 0
  // 第二优先级：按奖励金额降序

  const sorted = [...tasks].sort((a, b) => {
    // 检查是否有 relevance 字段
    const aRelevance = a.relevance || 0;
    const bRelevance = b.relevance || 0;

    // 如果一个有 relevance > 0，另一个没有，有 relevance 的优先
    if (aRelevance > 0 && bRelevance <= 0) return -1;
    if (bRelevance > 0 && aRelevance <= 0) return 1;

    // 如果都有 relevance > 0，按 relevance 降序
    if (aRelevance > 0 && bRelevance > 0) {
      return bRelevance - aRelevance;
    }

    // 如果都没有 relevance，按 reward 降序
    const aReward = a.reward || 0;
    const bReward = b.reward || 0;
    return bReward - aReward;
  });

  return sorted;
}

/**
 * 接取任务（使用 /a2a/task/claim）
 */
async function claimTask(task) {
  console.log(`\n🎯 正在接取任务: ${task.id}`);

  const payload = {
    secret: CONFIG.nodeSecret,
    task_id: task.id,
  };

  try {
    const result = await postToEvoMap('/task/claim', 'task/claim', payload);

    console.log(`✅ 成功接取任务: ${task.id}`);
    console.log(`   任务标题: ${task.title || 'N/A'}`);
    console.log(`   奖励金额: ${task.reward || 'N/A'} USDC`);

    return result;
  } catch (error) {
    console.error(`❌ 接取任务失败: ${error.message}`);
    throw error;
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('========================================');
  console.log('🚀 EvoMap 任务查询器 v4');
  console.log('========================================\n');

  try {
    // 步骤 1: 刷新节点 secret
    await refreshNodeSecret();

    // 步骤 2: 查询可用任务
    const tasks = await discoverTasks();

    if (tasks.length === 0) {
      console.log('\n✅ 当前没有可接取的任务');
      return;
    }

    // 步骤 3: 按优先级排序
    const sortedTasks = sortTasks(tasks);

    // 显示排序后的任务列表
    console.log('\n📋 任务列表（按优先级排序）:\n');

    sortedTasks.forEach((task, index) => {
      const relevance = task.relevance || 0;
      const reward = task.reward || 0;
      const minReputation = task.min_reputation || 'N/A';

      console.log(`${index + 1}. ${task.id}`);
      console.log(`   标题: ${task.title || 'N/A'}`);
      console.log(`   奖励: ${reward} USDC`);
      console.log(`   Relevance: ${relevance}`);
      console.log(`   最小声望: ${minReputation}`);
      console.log('');
    });

    // 步骤 4: 尝试接取任务
    console.log(`\n🎯 正在尝试接取任务（最多 ${CONFIG.taskLimit} 个）...\n`);

    let claimedCount = 0;
    let taskFullCount = 0;
    let alreadyJoinedCount = 0;

    for (const task of sortedTasks.slice(0, CONFIG.taskLimit)) {
      try {
        await claimTask(task);
        claimedCount++;
      } catch (error) {
        const errorMsg = error.message;
        if (errorMsg.includes('task_full')) {
          console.log(`⚠️  任务已满: ${task.id}`);
          taskFullCount++;
        } else if (errorMsg.includes('already_joined')) {
          console.log(`✅  已加入: ${task.id}`);
          alreadyJoinedCount++;
        } else {
          console.error(`❌  接取失败: ${task.id} - ${errorMsg}`);
        }
      }
    }

    // 汇总
    console.log('\n========================================');
    console.log('📊 接取汇总');
    console.log('========================================');
    console.log(`成功接取: ${claimedCount} 个`);
    console.log(`已加入（already_joined）: ${alreadyJoinedCount} 个`);
    console.log(`任务已满（task_full）: ${taskFullCount} 个`);
    console.log(`\n✅ 完成！\n`);

  } catch (error) {
    console.error(`\n❌ 主流程失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行
main().catch((error) => {
  console.error(`\n💥 未捕获的异常: ${error.message}`);
  process.exit(1);
});
