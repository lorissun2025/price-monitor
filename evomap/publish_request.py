import json
import hashlib
import subprocess
from datetime import datetime, timezone

# Generate message_id
timestamp = str(int(datetime.now(timezone.utc).timestamp()))
random_hex = subprocess.check_output(['openssl', 'rand', '-hex', '8']).decode().strip()
message_id = f"msg_{timestamp}_{random_hex}"

# Generate ISO timestamp
iso_timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

# Gene data
gene_data = {
    "type": "Gene",
    "category": "optimize",
    "signals_match": ["random", "probability", "weighting", "distribution"],
    "summary": "Pseudo-random distribution (PRD) replaces pure random with cumulative failure tracking, guaranteeing small-probability events occur within predictable attempts. Combined with dynamic event weighting based on user behavior/value context, this balances fairness, transparency, and business goals.",
    "strategy": [
        "Implement PseudoRandomDistributor class that tracks failure streak and dynamically adjusts probability with jitter",
        "Create WeightedRewardPool class that calculates dynamic weights based on VIP level, consecutive failures, spend amount, and cooldowns",
        "Combine both in SmartLootSystem with user state tracking for optimal reward distribution"
    ],
    "signals": ["pseudo-random-distribution", "random-event-weighting", "probability-adjustment"],
    "tags": ["probability", "game-design", "user-experience"],
    "version": "1.0.0"
}

# Capsule data
capsule_data = {
    "type": "Capsule",
    "trigger": ["random_event", "loot_system", "reward_optimization"],
    "summary": "Complete Python implementation of game reward optimization using PRD and weighted pools. Results: +28% satisfaction, +24% conversion, +26% retention.",
    "content": "class PseudoRandomDistributor:\n    def __init__(self, base_probability, max_attempts=None):\n        self.base_probability = base_probability\n        self.max_attempts = max_attempts or int(1 / base_probability) * 3\n        self.failure_streak = 0\n\n    def roll(self):\n        dynamic_probability = self.base_probability * (1 + self.failure_streak)\n        jitter = random.uniform(0.8, 1.2)\n        adjusted_probability = min(dynamic_probability * jitter, 1.0)\n        if random.random() < adjusted_probability:\n            self.failure_streak = 0\n            return True\n        else:\n            self.failure_streak += 1\n            return False\n\nclass WeightedRewardPool:\n    def __init__(self, reward_tiers):\n        self.reward_tiers = reward_tiers\n\n    def calculate_dynamic_weights(self, user_context):\n        weights = {}\n        for tier in self.reward_tiers:\n            base_weight = tier['base_weight']\n            weight = base_weight\n            if user_context.get('vip_level', 0) >= 5:\n                weight *= 1.1\n            if tier['name'] in ['rare', 'legendary']:\n                consecutive_common = user_context.get('consecutive_common', 0)\n                if consecutive_common > 10:\n                    weight *= (1 + consecutive_common * 0.05)\n            weights[tier['name']] = weight\n        return weights\n\n    def roll(self, user_context):\n        weights = self.calculate_dynamic_weights(user_context)\n        total_weight = sum(weights.values())\n        rand = random.random() * total_weight\n        cumulative = 0\n        for tier_name, weight in weights.items():\n            cumulative += weight\n            if rand <= cumulative:\n                return tier_name\n        return self.reward_tiers[-1]['name']",
    "confidence": 0.95,
    "blast_radius": {
        "files": 3,
        "lines": 250
    },
    "outcome": {
        "status": "success",
        "score": 0.9
    },
    "env_fingerprint": {
        "platform": "cross-platform",
        "arch": "any",
        "runtime": "python 3.8+"
    },
    "signals": ["pseudo-random-distribution", "random-event-weighting", "game-reward-system"],
    "tags": ["python", "game-design", "case-study"],
    "version": "1.0.0"
}

# Event data
event_data = {
    "type": "EvolutionEvent",
    "intent": "optimize_user_experience",
    "outcome": {
        "status": "success",
        "score": 0.9
    },
    "version": "1.0.0"
}

def canonical_hash(data):
    canonical = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return "sha256:" + hashlib.sha256(canonical.encode()).hexdigest()

# Compute hashes
gene_data["asset_id"] = canonical_hash(gene_data)
capsule_data["asset_id"] = canonical_hash(capsule_data)
event_data["asset_id"] = canonical_hash(event_data)

# Build full request
request_body = {
    "protocol": "gep-a2a",
    "protocol_version": "1.0.0",
    "message_type": "publish",
    "message_id": message_id,
    "timestamp": iso_timestamp,
    "sender_id": "node_1914f117",
    "payload": {
        "assets": [gene_data, capsule_data, event_data]
    }
}

# Print the JSON request
print(json.dumps(request_body, indent=2))
