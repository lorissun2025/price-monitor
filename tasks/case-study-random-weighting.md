# Case Study: Random Event Weighting and Pseudo-Random Distribution in E-commerce Recommendation

## Executive Summary

This case study demonstrates how random event weighting combined with pseudo-random distribution can solve a critical business problem in e-commerce: balancing recommendation quality with product diversity and new item exposure.

## The Business Problem

**Context:** A mid-sized e-commerce platform with 50,000+ SKUs was facing two key challenges:

1. **Filter Bubble Effect:** Personalized recommendations showed users increasingly similar items, reducing discovery and engagement
2. **New Product Stagnation:** New products with zero engagement history couldn't gain initial traction in the recommendation system

**Metrics Impact:**
- Session conversion rate dropped 12% over 6 months
- New product time-to-first-sale averaged 45 days (target: <14 days)
- User session diversity score decreased from 3.2 to 2.1 categories per session

## The Solution Architecture

### 1. Random Event Weighting System

**Core Concept:** Introduce controlled randomness into recommendation scoring to balance three objectives:

```python
class WeightedEventScorer:
    def __init__(self):
        self.weights = {
            'personalization': 0.5,    # User preference matching
            'diversity': 0.3,           # Category/attribute diversity
            'new_product': 0.15,        # New item boost
            'random_exploration': 0.05 # Serendipitous discovery
        }

    def calculate_score(self, item, user_history, session_context):
        score = (
            self.personalization_score(item, user_history) * self.weights['personalization'] +
            self.diversity_score(item, session_context) * self.weights['diversity'] +
            self.new_product_boost(item, user_history) * self.weights['new_product'] +
            self.random_exploration(item) * self.weights['random_exploration']
        )
        return score
```

**Key Features:**
- **Personalization (50%):** Standard collaborative filtering based on user history
- **Diversity (30%):** Penalty for items in categories already viewed in session
- **New Product Boost (15%):** Exponential decay based on product age (max boost for items <7 days)
- **Random Exploration (5%):** Pure random injection from long-tail catalog

### 2. Pseudo-Random Distribution Strategy

**Challenge:** How to provide randomness while maintaining user trust (users shouldn't feel recommendations are arbitrary)?

**Solution:** Seeded pseudo-random generation tied to user session:

```python
import hashlib
import random

class PseudoRandomSelector:
    def __init__(self, user_id, session_id):
        # Create deterministic seed from user+session
        seed_str = f"{user_id}_{session_id}_{datetime.now().strftime('%Y%m%d')}"
        self.seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (2**32)
        random.seed(self.seed)

    def select_exploration_items(self, catalog_subset, n=3):
        """
        Deterministic selection for consistency across pageloads,
        but varies daily for freshness
        """
        scored = [
            (item, random.random())
            for item in catalog_subset
        ]
        return sorted(scored, key=lambda x: x[1], reverse=True)[:n]
```

**Benefits of Seeded Randomness:**
1. **Consistency:** Same items in exploration slots for the entire session
2. **Freshness:** Seed changes daily, so exploration items vary across sessions
3. **Traceability:** Can reproduce any user's experience for debugging
4. **A/B Testing:** Seed can be bucketed for controlled experiments

### 3. Adaptive Weight Adjustment

**Real-time optimization:** Weights adapt based on user engagement signals:

```python
class AdaptiveWeightOptimizer:
    def __init__(self):
        self.base_weights = {
            'personalization': 0.5,
            'diversity': 0.3,
            'new_product': 0.15,
            'random_exploration': 0.05
        }
        self.impact_signals = {
            'personalization': lambda click: click.product_view_duration > 30,
            'diversity': lambda click: click.session_category_count > 2,
            'new_product': lambda click: click.product_age_days < 30,
            'random_exploration': lambda click: click.discovery_score > 0.7
        }

    def adjust_weights(self, user_session):
        """Adjust weights based on session behavior"""
        adjustments = {}
        for key, signal in self.impact_signals.items():
            success_rate = self.calculate_success_rate(user_session, signal)
            adjustments[key] = self.map_rate_to_weight_delta(success_rate)

        return {
            k: max(0.1, min(0.6, self.base_weights[k] + adjustments[k]))
            for k in self.base_weights
        }
```

## Implementation Results

### Phase 1: A/B Test (2 weeks)

**Setup:**
- Control: Standard collaborative filtering
- Test: Weighted random system with 5% exploration
- Metrics: Conversion rate, session diversity, new product discovery

| Metric | Control | Test | Improvement |
|--------|---------|------|-------------|
| Session Conversion Rate | 3.2% | 3.7% | +15.6% |
| Avg Categories/Session | 2.1 | 2.8 | +33.3% |
| New Products Viewed | 0.8 | 2.3 | +187.5% |
| Repeat Session Rate (7d) | 28% | 34% | +21.4% |

### Phase 2: Production Rollout (4 weeks)

**Gradual Rollout Strategy:**
- Week 1: 10% of users (power users excluded)
- Week 2: 30% of users
- Week 3: 60% of users
- Week 4: 100% with safety limits (conversion rate drop triggers rollback)

**Cumulative Results:**
- **Conversion Rate:** 3.2% → 4.1% (+28.1%)
- **New Product Time-to-First-Sale:** 45 days → 12 days (-73.3%)
- **User Retention (30d):** 42% → 48% (+14.3%)
- **Average Order Value:** $48 → $52 (+8.3%)

### Phase 3: Optimization (8 weeks)

**Learnings from User Behavior:**
1. Power users (top 20% by spend) prefer lower randomness (exploration weight: 2%)
2. New users benefit from higher randomness (exploration weight: 8%)
3. Session length correlates with optimal exploration weight
4. Mobile users more tolerant of randomness than desktop users

**Personalized Weight Configurations:**
```python
user_segments = {
    'power_user': {
        'personalization': 0.65,
        'diversity': 0.28,
        'new_product': 0.07,
        'random_exploration': 0.00  # Power users prefer precision
    },
    'new_user': {
        'personalization': 0.35,
        'diversity': 0.40,
        'new_product': 0.15,
        'random_exploration': 0.10  # New users need discovery
    },
    'mobile_user': {
        'personalization': 0.45,
        'diversity': 0.30,
        'new_product': 0.15,
        'random_exploration': 0.10
    },
    'desktop_user': {
        'personalization': 0.55,
        'diversity': 0.30,
        'new_product': 0.10,
        'random_exploration': 0.05
    }
}
```

## Technical Architecture

### Data Flow

```
User Request → User Segmentation → Weight Selection → Scoring Pipeline
                                                        ↓
                Catalog Items ←←←←←←←←←←←←←←←←←←←←
                 (filtered by relevance)
                                                        ↓
                       Pseudo-Random Exploration Injection
                                                        ↓
                       Top-N Selection with Diversity Penalty
                                                        ↓
                            Response to User
```

### Performance Characteristics

- **Latency:** 45ms average (additional 15ms vs. pure CF)
- **Cache Hit Rate:** 87% (seeded randomness enables session caching)
- **Memory:** +2GB per recommendation server (for diversity tracking)

## Key Learnings

### What Worked

1. **Small Randomness, Big Impact:** 5-10% exploration provided optimal balance
2. **Seeded Randomness Critical:** Prevented "jumping" recommendations within sessions
3. **Adaptive Weights Outperformed Static:** User behavior-based adjustment added +8% conversion
4. **Diversity Metric Matters:** Category diversity correlated with conversion (+0.31 Pearson)

### What Didn't Work

1. **Pure Random (20%+):** Conversion dropped 40%, users felt system "broken"
2. **Global Weights:** Power users complained about "irrelevant" recommendations
3. **No Seeding:** Same page reload showed different items (user trust issue)
4. **Aggressive New Product Boost:** Conversion rate dropped when >20% new items shown

## Conclusion

Random event weighting with pseudo-random distribution successfully solved the filter bubble and new product discovery problems:

**Business Impact:**
- **Revenue:** +$2.3M annually (28% conversion lift)
- **Product Velocity:** 73% faster time-to-market for new products
- **User Engagement:** +33% session diversity, +14% retention

**Technical Debt:**
- Added complexity to scoring pipeline
- Required new monitoring for weight drift
- Increased A/B testing overhead

**Recommendation:**
This approach is **highly recommended** for e-commerce, content platforms, and any recommendation system requiring balance between relevance and discovery. The key is: **controlled, seeded randomness with user-adaptive weighting**.

## Implementation Checklist

For teams adopting this approach:

- [ ] Define clear business metrics (conversion, diversity, discovery)
- [ ] Start with 5% exploration weight, never exceed 15%
- [ ] Implement seeded randomness for session consistency
- [ ] Add diversity penalty to scoring function
- [ ] Create user segmentation strategy
- [ ] Build weight adjustment feedback loop
- [ ] Monitor for metric degradation (set rollback triggers)
- [ ] Conduct A/B testing before full rollout
- [ ] Implement logging for reproducible debugging

---

**Case Study Duration:** 14 weeks total
**Implementation Cost:** $180K (2 engineers + data scientist)
**ROI:** 1277% (first year)
**Tech Stack:** Python, Redis, Kafka, PostgreSQL
