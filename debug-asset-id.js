#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Recursively sort object keys for consistent hashing
 */
function sortKeysDeep(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeysDeep);
  }

  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeysDeep(obj[key]);
  });

  return sorted;
}

/**
 * Compute asset_id using SHA256
 */
function computeAssetId(obj) {
  const clean = { ...obj };
  delete clean.asset_id;

  // Sort all nested keys recursively
  const sorted = sortKeysDeep(clean);

  // Convert to canonical JSON (no spaces)
  const json = JSON.stringify(sorted);

  console.log('\n=== JSON for hashing ===');
  console.log(json);

  // Compute SHA256 hash
  const hash = crypto.createHash('sha256').update(json).digest('hex');

  return 'sha256:' + hash;
}

// Test with capsule object
const capsule = {
  type: 'Capsule',
  gene_ref: 'sha256:524739870a71565c9277f8451f1e32c9fe220f3688b9630af40a290d4893c1df',
  outcome: {
    status: 'success',
    score: 0.88
  },
  summary: 'Real-time stock sentiment monitoring system with trend analysis and key insights extraction',
  trigger: [
    'sentiment',
    'monitoring',
    'stock',
    'trend',
    'social-media',
    'investor-sentiment'
  ],
  confidence: 0.88,
  blast_radius: {
    affected_systems: ['股票监控系统', '投资决策支持', '市场情绪分析'],
    impact_scope: '实现多平台情绪聚合分析，提供情绪趋势和关键观点，辅助投资决策',
    potential_side_effects: '情绪分析仅供参考，不构成投资建议',
    files: 8,
    lines: 450
  },
  env_fingerprint: {
    platform: 'Web + CLI',
    runtime: 'Node.js',
    database: 'PostgreSQL + Redis',
    environment: 'Production',
    scale: '支持多只股票监控，实时情绪更新',
    arch: 'microservices'
  },
  description: {
    title: '股票情绪监控实战应用',
    content: [
      '监控茅台（600519）、五粮液（000858）、招商银行（600036）等多只股票',
      '每30分钟抓取并分析各平台讨论内容',
      '计算加权情绪指数，追踪情绪趋势变化',
      '生成情绪报告，提供关键观点和投资建议',
      '通过 webhook 发送情绪预警通知'
    ],
    metrics: {
      dataSources: 4,
      updateInterval: '30 minutes',
      accuracy: 'LLM analysis ~85% accuracy',
      sentimentLabels: 5,
      trendTracking: true
    },
    useCases: [
      '短期交易辅助 - 情绪极端时注意风险',
      '长期投资参考 - 跟踪情绪长期趋势',
      '事件影响评估 - 新闻发布后观察情绪变化',
      '市场情绪监测 - 了解整体市场情绪'
    ],
    codeExample: `
const tracker = new StockSentimentTracker();
const sentiments = await analyzeStockSentiment('600519 茅台');
tracker.updateSentiment(sentiments);
const report = tracker.generateReport();

console.log(report.sentimentLabel);  // '乐观'
console.log(report.trendLabel);     // '情绪上升 📈'
console.log(report.recommendation);  // '市场情绪乐观，可以关注'
    `
  }
};

console.log('Computing asset_id for Capsule...');
const assetId = computeAssetId(capsule);
console.log('\n=== Result ===');
console.log('asset_id:', assetId);
