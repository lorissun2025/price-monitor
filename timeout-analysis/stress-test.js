#!/usr/bin/env node

/**
 * 压测脚本 - 测试 GLM-4.7 超时表现
 *
 * 测试场景：
 * 1. 简单任务 (< 10秒)
 * 2. 中等任务 (10-60秒)
 * 3. 复杂任务 (60-150秒)
 * 4. 超长任务 (> 150秒)
 */

import { spawn } from 'child_process';

// 测试配置
const CONFIG = {
  model: 'zai/glm-4.7',
  iterations: 5,  // 每个场景重复次数
  concurrency: 1,  // 1x 并发（之后改为 2x, 3x）
  timeoutMs: 600000  // 当前超时时间（测试后改为 150000）
};

// 测试任务
const TEST_TASKS = {
  simple: {
    name: '简单任务',
    prompt: '计算 1+1 等于几？',
    expectedTime: '< 10秒'
  },
  medium: {
    name: '中等任务',
    prompt: '总结一下 HTTP 协议的主要特点和常见状态码（100字以内）',
    expectedTime: '10-30秒'
  },
  complex: {
    name: '复杂任务',
    prompt: `请分析以下需求并给出技术方案：
需求：开发一个在线聊天系统，支持实时消息、群组聊天、消息历史记录。
要求：
1. 使用 WebSocket 实现实时通信
2. 消息存储在数据库
3. 支持离线消息推送
4. 前端使用 React，后端使用 Node.js

请给出：
1. 技术栈选择
2. 系统架构图
3. 核心功能实现方案
4. 性能优化建议`,
    expectedTime: '60-150秒'
  },
  timeout: {
    name: '超长任务',
    prompt: `请完成以下任务：
1. 阅读并分析当前工作目录下的所有文件
2. 总结项目结构和代码组织
3. 识别潜在的性能问题
4. 提出优化建议
5. 生成一份完整的技术文档

请详细执行每一步，不要跳过。`,
    expectedTime: '> 150秒（预期超时）'
  }
};

/**
 * 执行单个测试任务
 */
async function runTest(taskName, prompt, timeoutMs = CONFIG.timeoutMs) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';

    // 使用 openclaw 命令行工具执行任务
    const args = [
      'agent',
      'run',
      '--model', CONFIG.model,
      '--runtime', 'subagent',
      '--message', prompt,
      '--timeout', timeoutMs.toString()
    ];

    const child = spawn('openclaw', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const success = code === 0;
      const timedOut = errorOutput.includes('timeout');

      resolve({
        success,
        timedOut,
        code,
        duration,
        output: output.substring(0, 200),  // 只保留前 200 字符
        error: errorOutput.substring(0, 500)
      });
    });

    // 设置超时
    setTimeout(() => {
      child.kill();
      resolve({
        success: false,
        timedOut: true,
        code: -1,
        duration: Date.now() - startTime,
        output: '',
        error: 'Force timeout'
      });
    }, timeoutMs + 5000);
  });
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始压测...\n');
  console.log(`模型: ${CONFIG.model}`);
  console.log(`超时时间: ${CONFIG.timeoutMs}ms (${CONFIG.timeoutMs / 1000}秒)`);
  console.log(`重复次数: ${CONFIG.iterations}\n`);

  const results = {};

  for (const [taskKey, task] of Object.entries(TEST_TASKS)) {
    console.log(`\n📋 测试: ${task.name} (${task.expectedTime})`);
    console.log('━'.repeat(50));

    const taskResults = [];
    const durations = [];
    const timeouts = 0;

    for (let i = 0; i < CONFIG.iterations; i++) {
      console.log(`  运行 ${i + 1}/${CONFIG.iterations}...`);
      const result = await runTest(task.name, task.prompt);
      taskResults.push(result);
      durations.push(result.duration);

      if (result.timedOut) {
        timeouts++;
        console.log(`    ❌ 超时 (${(result.duration / 1000).toFixed(1)}秒)`);
      } else if (result.success) {
        console.log(`    ✅ 成功 (${(result.duration / 1000).toFixed(1)}秒)`);
      } else {
        console.log(`    ⚠️  失败 (${(result.duration / 1000).toFixed(1)}秒, code: ${result.code})`);
      }
    }

    // 统计
    durations.sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    const p95Duration = durations[Math.floor(durations.length * 0.95)] || durations[durations.length - 1];
    const p99Duration = durations[Math.floor(durations.length * 0.99)] || durations[durations.length - 1];

    results[taskKey] = {
      name: task.name,
      expectedTime: task.expectedTime,
      totalRuns: CONFIG.iterations,
      timeouts,
      successRate: ((CONFIG.iterations - timeouts) / CONFIG.iterations * 100).toFixed(2),
      avgDuration: (avgDuration / 1000).toFixed(2),
      minDuration: (minDuration / 1000).toFixed(2),
      maxDuration: (maxDuration / 1000).toFixed(2),
      p95Duration: (p95Duration / 1000).toFixed(2),
      p99Duration: (p99Duration / 1000).toFixed(2),
      results: taskResults
    };

    console.log('\n  📊 统计:');
    console.log(`    平均时长: ${(avgDuration / 1000).toFixed(2)}秒`);
    console.log(`    最短: ${(minDuration / 1000).toFixed(2)}秒, 最长: ${(maxDuration / 1000).toFixed(2)}秒`);
    console.log(`    P95: ${(p95Duration / 1000).toFixed(2)}秒, P99: ${(p99Duration / 1000).toFixed(2)}秒`);
    console.log(`    超时次数: ${timeouts}/${CONFIG.iterations} (${(timeouts / CONFIG.iterations * 100).toFixed(1)}%)`);
  }

  return results;
}

/**
 * 生成报告
 */
function generateReport(results) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 压测报告');
  console.log('='.repeat(60) + '\n');

  for (const [taskKey, result] of Object.entries(results)) {
    console.log(`\n${result.name} (${result.expectedTime})`);
    console.log('-'.repeat(40));
    console.log(`  成功率: ${result.successRate}%`);
    console.log(`  平均时长: ${result.avgDuration}秒`);
    console.log(`  最短/最长: ${result.minDuration}秒 / ${result.maxDuration}秒`);
    console.log(`  P95: ${result.p95Duration}秒, P99: ${result.p99Duration}秒`);
    console.log(`  超时率: ${((result.totalRuns - parseFloat(result.successRate) * result.totalRuns / 100) / result.totalRuns * 100).toFixed(1)}%`);
  }

  console.log('\n\n结论:');
  console.log('1. 简单任务应在 < 10秒内完成');
  console.log('2. 中等任务应在 10-60秒内完成');
  console.log('3. 复杂任务应在 60-150秒内完成');
  console.log('4. 超长任务预期超时，用于验证超时机制');

  return results;
}

// 主函数
(async () => {
  try {
    const results = await runAllTests();
    generateReport(results);

    // 保存结果到文件
    const fs = await import('fs');
    const outputPath = '/Users/sunsensen/.openclaw/workspace/timeout-analysis/stress-test-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ 结果已保存到: ${outputPath}`);

  } catch (error) {
    console.error('\n❌ 压测失败:', error.message);
    process.exit(1);
  }
})();
