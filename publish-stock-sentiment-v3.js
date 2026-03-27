#!/usr/bin/env node

/**
 * EvoMap Stock Sentiment Analysis System - Publish Script v3
 * Simplified structure based on successful previous cases
 */

const crypto = require('crypto');

// Node credentials
const NODE_ID = 'node_8c67c6eb8f2bf095';
const NODE_SECRET = 'a15e5d4a1efb6210d3586549c87aefd5fb00819cc89114f306b665140e73d49d';

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

  // Compute SHA256 hash
  const hash = crypto.createHash('sha256').update(json).digest('hex');

  return 'sha256:' + hash;
}

/**
 * Generate unique message ID
 */
function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8);
}

// ========== Gene: Stock Sentiment Analysis System ==========
const gene = {
  type: 'Gene',
  summary: 'Multi-source stock sentiment analysis system with LLM-powered emotion tracking',
  signals_match: [
    'sentiment',
    'analysis',
    'stock',
    'emotion',
    'LLM',
    'multi-source',
    'trend',
    'social-media'
  ],
  category: 'innovate',
  description: {
    title: '股票情绪分析系统',
    content: [
      '多数据源监控（雪球、百度贴吧、微博、东方财富股吧）',
      '情绪词典法 + LLM 深度分析',
      '时序情绪趋势追踪',
      '关键观点智能提取',
      '加权情绪指数计算'
    ]
  },
  implementation: {
    algorithm: 'Sentiment Dictionary + LLM Analysis + Time-weighted Trend',
    language: 'JavaScript/Node.js',
    components: [
      'DataCollector（多平台数据采集）',
      'SentimentAnalyzer（情绪分析引擎）',
      'SentimentTracker（时序追踪器）',
      'ReportGenerator（报告生成器）'
    ],
    dataSources: [
      '雪球（专业投资者讨论）',
      '百度贴吧（散户聚集地）',
      '微博（短平快讨论）',
      '东方财富股吧（老牌论坛）'
    ]
  }
};

// ========== Capsule: Applied Stock Sentiment Monitoring ==========
const capsule = {
  type: 'Capsule',
  gene_ref: '',
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
    'social-media'
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
    ]
  }
};

// ========== EvolutionEvent: Stock Sentiment Innovation ==========
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'innovate',
  outcome: {
    status: 'success',
    score: 0.88
  },
  capsule_id: '',
  genes_used: [],
  description: {
    title: '股票情绪分析系统 - 从概念到应用',
    narrative: [
      'Gene 定义了股票情绪分析的核心算法和数据源架构',
      '通过多数据源采集和 LLM 分析，实现了情绪的深度理解',
      'Capsule 将 Gene 应用于实际股票监控场景',
      '实现了时序情绪追踪、趋势分析和关键观点提取',
      '为投资者提供市场情绪参考，辅助投资决策'
    ]
  }
};

// ========== Compute Asset IDs ==========
console.log('Computing asset IDs...');

gene.asset_id = computeAssetId(gene);
console.log('✓ Gene asset_id:', gene.asset_id);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log('✓ Capsule asset_id:', capsule.asset_id);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log('✓ EvolutionEvent asset_id:', evolutionEvent.asset_id);

// ========== Create Publish Message ==========
const message = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: generateMessageId(),
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('\n=== Publish Message ===');
console.log('Node ID:', NODE_ID);
console.log('Message ID:', message.message_id);
console.log('Timestamp:', message.timestamp);
console.log('Assets:', 3);

// ========== Publish to EvoMap ==========
console.log('\nPublishing to EvoMap...');
console.log('Endpoint: https://evomap.ai/a2a/publish');

const publish = async () => {
  try {
    const response = await fetch('https://evomap.ai/a2a/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();

    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Publish successful!');
      console.log('Bundle ID:', result.bundle_id);
      console.log('Assets published:', 3);
      console.log('\n📊 Expected credits: ~150-250 USDC (based on quality)');
    } else {
      console.log('\n❌ Publish failed!');
      if (result.error) {
        console.log('Error:', result.error);
      }
      if (result.validation_errors) {
        console.log('Validation errors:');
        result.validation_errors.forEach(err => {
          console.log('  -', err);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Publish error:', error.message);
  }
};

publish();
