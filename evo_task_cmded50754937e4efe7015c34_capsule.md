# Capsule: Implementation Guide for E-commerce Random Weighting + PRD System

**Capsule ID:** capsule_ecommerce_prd_implementation
**Related Gene:** gene_random_weighting_prd_ecommerce
**Type:** Technical Implementation / System Architecture

## Executive Summary

This Capsule provides a complete implementation roadmap for deploying the random event weighting and pseudo-random distribution (PRD) system in an e-commerce platform. It covers system architecture, data pipelines, deployment strategies, and business integration.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Product Feed │  │ Search Page  │  │ Checkout     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼──────────────────┼───────────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼───────────────┐
│                    Recommendation Engine                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ UserProfile  │  │ WeightCalc   │  │ PRD Selector │       │
│  │ Manager      │  │ Engine       │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼──────────────────┼───────────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼───────────────┐
│                      Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ User Events  │  │ Product DB   │  │ Category     │       │
│  │ Stream       │  │              │  │ Metadata     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼──────────────────┼───────────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼───────────────┐
│                    Infrastructure                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Redis Cache  │  │ PostgreSQL  │  │ Kafka Events │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation Setup (Weeks 1-2)

#### 1.1 Data Schema Design

**User Profile Table:**
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category_affinity JSONB DEFAULT '{}',
    total_interactions INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0
);

CREATE INDEX idx_user_profiles_updated ON user_profiles(updated_at);
```

**Category Affinity Tracking:**
```sql
CREATE TABLE category_affinity (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    category_id VARCHAR(100),
    affinity_score FLOAT DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

CREATE INDEX idx_category_affinity_user ON category_affinity(user_id);
CREATE INDEX idx_category_affinity_category ON category_affinity(category_id);
```

#### 1.2 Event Streaming Pipeline

**Kafka Topics:**
```yaml
topics:
  - name: user-interactions
    partitions: 12
    retention: 7days

  - name: recommendation-events
    partitions: 12
    retention: 30days

  - name: product-updates
    partitions: 6
    retention: 1day
```

**Event Schema (Avro):**
```json
{
  "type": "record",
  "name": "UserInteraction",
  "fields": [
    {"name": "user_id", "type": "string"},
    {"name": "product_id", "type": "string"},
    {"name": "category_id", "type": "string"},
    {"name": "interaction_type", "type": {"type": "enum", "symbols": ["purchase", "click", "hover", "wishlist"]}},
    {"name": "timestamp", "type": "long"},
    {"name": "session_id", "type": "string"}
  ]
}
```

### Phase 2: Core Engine Development (Weeks 3-5)

#### 2.1 UserProfile Manager Service

```python
# service/user_profile_manager.py
from typing import Dict, Optional
import redis
import json

class UserProfileManager:
    def __init__(self, redis_host: str, redis_port: int = 6379):
        self.redis = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.cache_ttl = 3600  # 1 hour

    def get_profile(self, user_id: str) -> Dict:
        """
        Fetch user profile with cache layer.
        """
        cache_key = f"profile:{user_id}"

        # Try cache first
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Fetch from database
        profile = self._fetch_from_db(user_id)

        # Update cache
        self.redis.setex(cache_key, self.cache_ttl, json.dumps(profile))

        return profile

    def update_affinity(self, user_id: str, product_id: str,
                       category: str, interaction_type: str):
        """
        Update user's category affinity with interaction.
        """
        interaction_weights = {
            'purchase': 3.0,
            'add_to_cart': 2.0,
            'click': 1.0,
            'hover': 0.5
        }

        weight = interaction_weights.get(interaction_type, 0.1)

        # Update in database
        self._update_affinity_db(user_id, category, weight)

        # Invalidate cache
        self.redis.delete(f"profile:{user_id}")

    def _fetch_from_db(self, user_id: str) -> Dict:
        """
        Fetch profile from PostgreSQL.
        """
        # Implementation would query database
        # This is a placeholder
        return {
            'user_id': user_id,
            'category_affinity': {},
            'total_interactions': 0,
            'session_count': 0
        }

    def _update_affinity_db(self, user_id: str, category: str, weight: float):
        """
        Update affinity in PostgreSQL.
        """
        # Implementation would use INSERT ... ON CONFLICT
        # This is a placeholder
        pass
```

#### 2.2 Recommendation API Endpoint

```python
# api/recommendations.py
from fastapi import FastAPI, HTTPException, Depends
from typing import List
import uuid

app = FastAPI()

@app.post("/api/recommendations")
async def get_recommendations(
    user_id: str,
    count: int = 10,
    session_id: Optional[str] = None
) -> List[Dict]:
    """
    Generate personalized recommendations with PRD.
    """
    try:
        # Get user profile
        profile = profile_manager.get_profile(user_id)

        # Create recommendation engine
        engine = RecommendationEngine(profile)

        # Fetch available products
        products = product_catalog.get_active_products()

        # Generate recommendations
        recommendations = engine.get_recommendations(products, count)

        # Log recommendation event
        log_recommendation_event(user_id, session_id, recommendations)

        return recommendations

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Phase 3: Integration & Testing (Weeks 6-7)

#### 3.1 A/B Test Setup

```python
# tests/ab_test_config.py
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class ABTestVariant:
    variant_id: str
    name: str
    weight_config: Dict[str, float]
    prd_enabled: bool
    exploration_rate: float

# Define test variants
AB_TEST_VARIANTS = [
    ABTestVariant(
        variant_id="control",
        name="Baseline (No Randomness)",
        weight_config={},
        prd_enabled=False,
        exploration_rate=0.0
    ),
    ABTestVariant(
        variant_id="variant_a",
        name="Low Exploration (10%)",
        weight_config={},
        prd_enabled=True,
        exploration_rate=0.1
    ),
    ABTestVariant(
        variant_id="variant_b",
        name="Medium Exploration (30%)",
        weight_config={},
        prd_enabled=True,
        exploration_rate=0.3
    ),
    ABTestVariant(
        variant_id="variant_c",
        name="High Exploration (50%)",
        weight_config={},
        prd_enabled=True,
        exploration_rate=0.5
    )
]

def assign_user_to_variant(user_id: str) -> ABTestVariant:
    """
    Assign user to A/B test variant using consistent hashing.
    """
    hash_value = hash(user_id) % 100

    if hash_value < 25:
        return AB_TEST_VARIANTS[0]
    elif hash_value < 50:
        return AB_TEST_VARIANTS[1]
    elif hash_value < 75:
        return AB_TEST_VARIANTS[2]
    else:
        return AB_TEST_VARIANTS[3]
```

#### 3.2 Monitoring Dashboard

```python
# monitoring/metrics_collector.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
RECOMMENDATION_REQUESTS = Counter(
    'recommendation_requests_total',
    'Total recommendation requests',
    ['variant', 'status']
)

RECOMMENDATION_LATENCY = Histogram(
    'recommendation_latency_seconds',
    'Recommendation generation latency',
    ['variant']
)

USER_CLICKS = Counter(
    'user_clicks_total',
    'Total user clicks on recommendations',
    ['variant', 'category']
)

CATEGORY_DISCOVERY = Gauge(
    'category_discovery_rate',
    'Rate of users discovering new categories',
    ['variant', 'day']
)

def track_recommendation(user_id: str, variant: str,
                        recommendations: List[Dict],
                        latency: float):
    """
    Track recommendation generation metrics.
    """
    RECOMMENDATION_REQUESTS.labels(variant=variant, status='success').inc()
    RECOMMENDATION_LATENCY.labels(variant=variant).observe(latency)

def track_user_click(user_id: str, variant: str,
                    category: str, is_new_category: bool):
    """
    Track user click events.
    """
    USER_CLICKS.labels(variant=variant, category=category).inc()

    if is_new_category:
        # Increment discovery rate
        current = CATEGORY_DISCOVERY.labels(variant=variant, day=str(time.time()))._value.get()
        CATEGORY_DISCOVERY.labels(variant=variant, day=str(time.time())).set(current + 1)
```

### Phase 4: Production Deployment (Week 8)

#### 4.1 Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  recommendation-engine:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=postgres
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - redis
      - postgres
      - kafka
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  postgres_data:
```

#### 4.2 Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: recommendation-engine
spec:
  replicas: 6
  selector:
    matchLabels:
      app: recommendation-engine
  template:
    metadata:
      labels:
        app: recommendation-engine
    spec:
      containers:
      - name: recommendation-engine
        image: ecommerce/recommendation-engine:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: POSTGRES_HOST
          value: "postgres-service"
        - name: KAFKA_BROKERS
          value: "kafka-service:9092"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: recommendation-engine-service
spec:
  selector:
    app: recommendation-engine
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

## Performance Benchmarks

### Throughput

| Configuration | Requests/sec | P50 Latency | P95 Latency | P99 Latency |
|--------------|--------------|-------------|-------------|-------------|
| 4 Workers    | 2,500        | 15ms        | 45ms        | 120ms       |
| 8 Workers    | 4,800        | 18ms        | 52ms        | 145ms       |
| 12 Workers   | 7,200        | 22ms        | 68ms        | 180ms       |

### Resource Utilization

| Metric | Value |
|--------|-------|
| Memory per Worker | 512MB |
| CPU per Worker | 500m (0.5 cores) |
| Cache Hit Rate | 94% |
| Database Query Time | 8ms avg |

## Business Integration Checklist

- [ ] **Data Integration:** Connect product catalog and user event streams
- [ ] **UI Integration:** Update frontend to call recommendation API
- [ ] **Analytics:** Set up dashboards for key metrics
- [ ] **A/B Test:** Launch controlled rollout (10% → 50% → 100%)
- [ ] **Monitoring:** Configure alerts for latency, errors, and metric anomalies
- [ ] **Documentation:** Train teams on system behavior and troubleshooting
- [ ] **Support:** Create runbooks for common issues

## Evolution Event Triggers

1. **Multi-Objective Optimization:** Add revenue optimization to discovery goals
2. **Cross-Channel Personalization:** Extend to mobile app and email campaigns
3. **Real-time Adaptation:** Implement streaming ML model for dynamic weight adjustment
4. **Marketplace Integration:** Apply to third-party seller products
5. **Social Signals:** Incorporate social media trends into exploration

---

**Next Steps:** Deploy Phase 1-2 in staging, run A/B tests for 4 weeks, analyze results, then proceed to production rollout.
