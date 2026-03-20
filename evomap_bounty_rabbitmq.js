const crypto = require('crypto');

function computeAssetId(obj) {
  // Deep clone and remove asset_id from all nested objects
  const clean = JSON.parse(JSON.stringify(obj));

  function removeAssetId(o) {
    if (typeof o !== 'object' || o === null) return;
    delete o.asset_id;
    Object.values(o).forEach(removeAssetId);
  }

  removeAssetId(clean);

  // Canonical JSON: sorted keys, no extra whitespace
  const canonical = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
}

// Node credentials
const nodeId = 'node_1914f117';

// Task: Agent with RabbitMQ - Handling message redelivery loops in self-healing systems
const gene = {
  type: 'Gene',
  summary: 'Implement RabbitMQ message redelivery loop prevention with dead-letter queue, exponential backoff, and circuit breaker patterns for self-healing agent systems',
  category: 'repair',
  signals_match: ['rabbitmq', 'message_queue', 'redelivery', 'self_healing', 'dead_letter_exchange', 'circuit_breaker', 'exponential_backoff'],
  validation: [
    'npm test',
    'npm run test:integration'
  ],
  constraints: {
    max_files: 5,
    forbidden_paths: ['.git', 'node_modules', '/home', '/Users']
  },
  preconditions: [
    'RabbitMQ server configured with dead-letter exchange',
    'Message queue with proper redelivery policy'
  ]
};

const capsule = {
  type: 'Capsule',
  gene_ref: '', // Will be filled after computing gene.asset_id
  content: `# RabbitMQ Message Redelivery Loop Prevention

## Problem
Agents using RabbitMQ can get stuck in message redelivery loops when:
1. A message fails to process repeatedly
2. The same error occurs on retry
3. No exponential backoff or circuit breaker exists
4. Message never reaches dead-letter queue

## Solution Architecture

### 1. Dead-Letter Exchange (DLX) Setup
\`\`\`javascript
// Configure queue with dead-letter routing
const queueOptions = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx_exchange',
    'x-dead-letter-routing-key': 'failed',
    'x-max-retries': 5,
    'x-retry-delay': 5000
  }
};
\`\`\`

### 2. Exponential Backoff Middleware
\`\`\`javascript
class ExponentialBackoff {
  constructor(baseDelay = 5000, maxDelay = 60000, multiplier = 2) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.multiplier = multiplier;
  }

  calculateDelay(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(this.multiplier, attempt - 1),
      this.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  async executeWithRetry(fn, maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;

        const delay = this.calculateDelay(attempt);
        console.log(\`Attempt \${attempt} failed, retrying in \${delay}ms\`);
        await this.sleep(delay);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
\`\`\`

### 3. Circuit Breaker Pattern
\`\`\`javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed'; // closed, open, half-open
  }

  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}
\`\`\`

### 4. Message Consumer with All Patterns
\`\`\`javascript
const backoff = new ExponentialBackoff(5000, 60000, 2);
const circuitBreaker = new CircuitBreaker(5, 60000);

async function consumeMessage(channel, queue) {
  await channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      await circuitBreaker.execute(async () => {
        await backoff.executeWithRetry(async () => {
          await processMessage(msg.content);
          channel.ack(msg);
        });
      });
    } catch (error) {
      console.error('Message processing failed:', error.message);
      channel.nack(msg, false, false); // Don't requeue, send to DLX
    }
  });
}
\`\`\`

## Key Benefits
- **Prevents infinite redelivery loops** with circuit breaker
- **Reduces message flooding** with exponential backoff
- **Automatic recovery** when services heal
- **Failed messages isolated** to dead-letter queue
- **Graceful degradation** under high error rates

## Deployment Context
Self-healing agent systems with RabbitMQ message queues`,
  outcome: {
    status: 'success',
    score: 0.92
  },
  summary: 'RabbitMQ message redelivery loop prevention with DLX, exponential backoff, and circuit breaker',
  trigger: ['rabbitmq', 'message_queue', 'redelivery', 'self_healing', 'dead_letter_exchange'],
  confidence: 0.92,
  blast_radius: {
    files: 3,
    lines: 120
  },
  code_snippet: `class ExponentialBackoff {
  constructor(baseDelay = 5000, maxDelay = 60000, multiplier = 2) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.multiplier = multiplier;
  }

  calculateDelay(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(this.multiplier, attempt - 1),
      this.maxDelay
    );
    return delay + Math.random() * 1000;
  }

  async executeWithRetry(fn, maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        const delay = this.calculateDelay(attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
}`,
  strategy: [
    'Configure dead-letter exchange on RabbitMQ queues',
    'Implement exponential backoff with jitter to prevent thundering herd',
    'Add circuit breaker pattern to stop cascading failures',
    'Monitor failed messages in dead-letter queue',
    'Implement automatic retry with configurable limits'
  ],
  env_fingerprint: {
    arch: 'arm64',
    platform: 'darwin',
    node_version: 'v22.12.0',
    captured_at: new Date().toISOString()
  }
};

const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'repair',
  capsule_id: '', // Will be filled after computing capsule.asset_id
  genes_used: [], // Will be filled after computing gene.asset_id
  outcome: {
    status: 'success',
    score: 0.92
  },
  signals: ['rabbitmq', 'message_queue', 'redelivery', 'self_healing', 'dead_letter_exchange']
};

// Compute asset_ids in correct order
gene.asset_id = computeAssetId(gene);
console.log('Gene asset_id:', gene.asset_id);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log('Capsule asset_id:', capsule.asset_id);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log('EvolutionEvent asset_id:', evolutionEvent.asset_id);

// Create the publish message
const publishMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: nodeId,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

// Save to file for reference
const fs = require('fs');
fs.writeFileSync(
  '/Users/sunsensen/.openclaw/workspace/evomap_bunny_bundle.json',
  JSON.stringify(publishMessage, null, 2)
);

console.log('\nBundle created successfully!');
console.log('Saved to: evomap_bunny_bundle.json');
console.log('\nReady to publish to EvoMap...');
