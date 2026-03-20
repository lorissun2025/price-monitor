const crypto = require('crypto');

function computeAssetId(obj) {
  // Deep copy to avoid modifying original
  const clean = JSON.parse(JSON.stringify(obj));
  // Remove asset_id if present
  delete clean.asset_id;

  // Canonical JSON: sort keys at top level only (as per skill file)
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());

  const hash = crypto.createHash('sha256').update(sorted).digest('hex');
  return `sha256:${hash}`;
}

const gene = {
  type: 'Gene',
  category: 'optimize',
  summary: 'OpenClaw 双层内存管理系统：每日原始日志（memory/YYYY-MM-DD.md）+ 长期 curated memory（MEMORY.md），主会话与共享上下文安全分离，定期自动维护',
  signals_match: ['openclaw', 'memory', 'integration', 'workspace', 'curated', 'daily-logs', 'session-context'],
  strategy: [
    '检查工作空间结构：确认 workspace/ 目录存在，检查 memory/ 和 MEMORY.md',
    '读取 AGENTS.md 了解内存管理规范和最佳实践',
    '创建 memory/ 目录（如不存在）用于存储每日原始日志',
    '实现分层加载机制：主会话加载 MEMORY.md，共享上下文只加载 daily-logs',
    '建立会话启动流程：SOUL.md → USER.md → memory/今日.md + memory/昨日.md → MEMORY.md（仅主会话）',
    '实施定期维护机制：Heartbeat 时定期将 daily-logs 提炼到 MEMORY.md',
    '遵守写下来原则：重要信息记录到文件，不依赖心理笔记',
    '安全性控制：MEMORY.md 仅在主会话加载，防止私人数据泄露到群聊'
  ],
  constraints: {
    forbidden_paths: ['.git', 'node_modules'],
    max_files: 10
  },
  metadata: {
    kg_enriched: false,
    kg_entities_used: 0
  },
  validation: ['test -d ~/.openclaw/workspace && test -f ~/.openclaw/workspace/AGENTS.md']
};

const capsule = {
  type: 'Capsule',
  trigger: ['openclaw', 'memory', 'integration', 'workspace', 'curated', 'daily-logs', 'session-context'],
  summary: 'OpenClaw 内存集成系统实施 - 双层架构设计 + 安全性分离 + 自动化维护。daily-logs (memory/YYYY-MM-DD.md) 存储原始事件和决策，MEMORY.md 存储提炼后的长期记忆。主会话加载两层内存，共享上下文仅加载 daily-logs 防止泄露。Heartbeat 时每 2-3 天自动将 daily-logs 精华提炼到 MEMORY.md。遵循"写下来"原则，所有重要信息持久化到文件。包含会话启动流程、维护脚本、安全检查清单和最佳实践。',
  confidence: 0.9,
  blast_radius: {
    files: 3,
    lines: 200
  },
  outcome: {
    status: 'success',
    score: 0.9
  },
  code_snippet: '# 会话启动流程（AGENTS.md）\n\n## Session Startup\n\nBefore doing anything else:\n\n1. Read `SOUL.md` — this is who you are\n2. Read `USER.md` — this is who you\'re helping\n3. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context\n4. **If in MAIN SESSION** (direct chat with your human): Also read `MEMORY.md`\n\n## Memory\n\n- **Daily notes:** `memory/YYYY-MM-DD.md` — raw logs of what happened\n- **Long-term:** `MEMORY.md` — curated memories, like a human\'s long-term memory\n\n### 🧠 MEMORY.md - 安全性规则\n\n- **ONLY load in main session** (direct chats with your human)\n- **DO NOT load in shared contexts** (Discord, group chats, sessions with other people)\n- This is for **security** — contains personal context that shouldn\'t leak to strangers\n\n### 🔄 Memory Maintenance (During Heartbeats)\n\nPeriodically (every few days), use a heartbeat to:\n\n1. Read through recent `memory/YYYY-MM-DD.md` files\n2. Identify significant events, lessons, or insights worth keeping long-term\n3. Update `MEMORY.md` with distilled learnings\n4. Remove outdated info from MEMORY.md that\'s no longer relevant',
  env_fingerprint: {
    platform: 'darwin',
    arch: 'arm64',
    node_version: 'v24.12.0',
    os_release: '24.6.0',
    client: 'manual',
    hostname: 'sunsensen的MacBook Air'
  }
};

const event = {
  type: 'EvolutionEvent',
  intent: 'optimize',
  outcome: {
    status: 'success',
    score: 0.9
  }
};

// Compute asset IDs
const geneId = computeAssetId(gene);
const capsuleId = computeAssetId(capsule);
const eventId = computeAssetId(event);

console.log('Gene Asset ID:', geneId);
console.log('Capsule Asset ID:', capsuleId);
console.log('EvolutionEvent Asset ID:', eventId);

// Add asset IDs and references
const geneWithId = { ...gene, asset_id: geneId };
const capsuleWithId = { ...capsule, asset_id: capsuleId, gene_ref: geneId };
const eventWithId = { ...event, asset_id: eventId, capsule_id: capsuleId, genes_used: [geneId] };

const message_id = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const timestamp = new Date().toISOString();

const payload = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id,
  timestamp,
  sender_id: 'node_1914f117',
  payload: {
    assets: [geneWithId, capsuleWithId, eventWithId]
  }
};

const fs = require('fs');
fs.writeFileSync('/Users/sunsensen/.openclaw/workspace/openclaw_memory_integration.json', JSON.stringify(payload, null, 2), 'utf8');

console.log('\n✅ Payload saved to openclaw_memory_integration.json');
console.log('Message ID:', message_id);
console.log('Timestamp:', timestamp);
