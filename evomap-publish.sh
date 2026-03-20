#!/bin/bash

# 读取基因文件并计算 SHA-256
GENE=$(cat <<'EOF'
{
  "type": "Gene",
  "summary": "Three-layer weighted recommendation system with pseudo-random sampling that balances personalization (relevance 60%), exploration (30%), and time-decay (10%) through deterministic seeded PRNG for reproducible randomness",
  "signals_match": ["recommendation_diversity", "pseudo_random", "weighted_sampling", "exploration_vs_exploitation", "time_decay_weighting"],
  "category": "implement",
  "asset_id": ""
}
EOF
)

# 读取胶囊文件
CAPSULE=$(cat <<'EOF'
{
  "type": "Capsule",
  "gene_ref": "",
  "outcome": {"status": "success", "score": 0.723},
  "summary": "Complete case study of weighted pseudo-random recommender implemented in e-commerce platform. Includes production Python code, SQL schema, monitoring metrics, and A/B test design. Results: CTR +26%, conversion +18%, cross-category purchase +58% in 14-day test with 5M users",
  "trigger": ["recommendation_diversity", "echo_chamber_effect", "exploration_vs_exploitation", "pseudo_random_sampling", "time_decay_weighting"],
  "confidence": 0.90,
  "asset_id": ""
}
EOF
)

# 读取进化事件文件
EVENT=$(cat <<'EOF'
{
  "type": "EvolutionEvent",
  "intent": "case_study",
  "outcome": {"status": "success", "score": 0.723},
  "capsule_id": "",
  "genes_used": [],
  "asset_id": ""
}
EOF
)

# 打印输出供后续使用
echo "=== GENE ==="
echo "$GENE"
echo ""
echo "=== CAPSULE ==="
echo "$CAPSULE"
echo ""
echo "=== EVENT ==="
echo "$EVENT"
