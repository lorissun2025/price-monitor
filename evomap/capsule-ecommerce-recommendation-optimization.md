# Case Study: E-Commerce Recommendation System Optimization

## Business Problem

A mid-sized e-commerce platform (50M+ monthly active users) was experiencing declining user engagement with their product recommendations. The core issues were:

1. **Repetition Fatigue**: Users saw the same products repeatedly
2. **Low Discovery**: Users rarely discovered new relevant products
3. **A/B Testing Bias**: Some variants had unbalanced traffic allocation
4. **Category Imbalance**: Certain product categories dominated recommendations

Metrics before optimization:
- Click-Through Rate (CTR): 2.1%
- Conversion Rate: 0.8%
- User Engagement Score: 58/100
- Return Rate: 12%
- Category Diversity Index: 0.43

## Solution Architecture

### Phase 1: Random Event Weighting Implementation

**Objective**: Optimize recommendation algorithm selection and category allocation.

**Algorithm Weighting Strategy**:

| Algorithm | Initial Weight | After 30 Days | After 90 Days | Rationale |
|-----------|---------------|---------------|---------------|-----------|
| Collaborative Filtering | 0.40 | 0.35 | 0.30 | Strong baseline, but can create echo chambers |
| Content-Based Filtering | 0.30 | 0.35 | 0.40 | Good for discovery, needs more emphasis |
| Hybrid Approach | 0.20 | 0.25 | 0.25 | Balanced performance |
| Trend-Based | 0.10 | 0.05 | 0.05 | Used sparingly for viral products |

**Implementation Details**:

```python
class AlgorithmSelector:
    def __init__(self, initial_weights):
        self.weights = initial_weights
        self.performance_history = {
            'collaborative': [],
            'content_based': [],
            'hybrid': [],
            'trend_based': []
        }

    def select_algorithm(self, user_segment):
        # Dynamic weighting based on user segment
        segment_adjustments = {
            'new_user': {'collaborative': 0.7, 'content_based': 0.3},
            'power_user': {'collaborative': 0.4, 'content_based': 0.6},
            'returning': {'collaborative': 0.5, 'content_based': 0.5}
        }

        adjusted_weights = self.adjust_weights(user_segment, segment_adjustments)
        return self.weighted_random_select(adjusted_weights)

    def adjust_weights(self, user_segment, adjustments):
        # Apply segment-specific adjustments
        base = self.weights.copy()
        for algo, factor in adjustments.get(user_segment, {}).items():
            base[algo] *= factor
        return self.normalize_weights(base)

    def weighted_random_select(self, weights):
        import random
        r = random.random()
        cumulative = 0
        for algo, weight in weights.items():
            cumulative += weight
            if r <= cumulative:
                return algo
        return list(weights.keys())[-1]

    def update_weights(self, performance_data):
        # Reinforcement learning: update weights based on performance
        for algo, metrics in performance_data.items():
            self.performance_history[algo].append(metrics['ctr'])

        # Calculate performance ratios
        avg_performance = {
            algo: np.mean(history[-100:])  # Last 100 interactions
            for algo, history in self.performance_history.items()
        }

        # Update weights proportional to performance
        total = sum(avg_performance.values())
        self.weights = {
            algo: perf / total
            for algo, perf in avg_performance.items()
        }
```

**Category Weighting Strategy**:

Product categories were weighted based on:
- User purchase history (40%)
- Browse history (30%)
- Category popularity (20%)
- Inventory levels (10%)

```python
class CategoryWeighting:
    def __init__(self):
        self.base_weights = self.load_category_weights()

    def calculate_category_weights(self, user_id):
        user_history = self.get_user_history(user_id)

        # Time-decayed purchase influence
        purchase_weights = self.calculate_purchase_decay(user_history['purchases'])

        # Browse history influence
        browse_weights = self.calculate_browse_influence(user_history['browses'])

        # Combine weights
        combined = {}
        for category in self.base_weights:
            combined[category] = (
                self.base_weights[category] * 0.2 +
                purchase_weights.get(category, 0) * 0.4 +
                browse_weights.get(category, 0) * 0.3 +
                self.inventory_factor(category) * 0.1
            )

        return self.normalize_weights(combined)

    def calculate_purchase_decay(self, purchases):
        # Recent purchases have higher influence
        weights = defaultdict(float)
        for purchase in purchases:
            days_ago = (datetime.now() - purchase.date).days
            decay = math.exp(-days_ago / 30)  # 30-day half-life
            weights[purchase.category] += purchase.amount * decay
        return dict(weights)
```

### Phase 2: Pseudo-Random Distribution Implementation

**Objective**: Ensure diverse recommendations while maintaining relevance.

**PRD for Product Selection**:

```python
class PseudoRandomDistributor:
    def __init__(self, window_size=100):
        self.window_size = window_size
        self.history = deque(maxlen=window_size)

    def select_product(self, candidates, num_selections=10):
        """
        Select products using pseudo-random distribution to ensure:
        1. No product appears twice in a session
        2. Category diversity
        3. No product appears too frequently over time
        """

        # Filter out products already shown recently
        recent_products = set(self.history)
        available = [p for p in candidates if p.id not in recent_products]

        if len(available) < num_selections:
            # If not enough available, relax constraint
            available = candidates

        # Ensure category diversity
        selected = self.ensure_category_diversity(available, num_selections)

        # Track history
        for product in selected:
            self.history.append(product.id)

        return selected

    def ensure_category_diversity(self, candidates, num_selections):
        """
        Select products from different categories using PRD
        """
        # Group by category
        by_category = defaultdict(list)
        for product in candidates:
            by_category[product.category].append(product)

        # Distribute selections across categories
        num_categories = min(len(by_category), num_selections)
        per_category = num_selections // num_categories
        remainder = num_selections % num_categories

        selected = []
        category_pool = list(by_category.keys())

        for i in range(num_categories):
            # Use pseudo-random to select category
            category_index = self.prd_select(len(category_pool))
            category = category_pool.pop(category_index)

            # Select products from this category
            num_from_category = per_category + (1 if i < remainder else 0)
            category_products = by_category[category]

            if len(category_products) >= num_from_category:
                selected.extend(random.sample(category_products, num_from_category))
            else:
                selected.extend(category_products)

        return selected

    def prd_select(self, n):
        """
        Pseudo-random distribution selection
        Avoids consecutive selections and ensures even distribution
        """
        import random
        if not hasattr(self, 'prd_state'):
            self.prd_state = {'attempts': 0, 'success': False}

        self.prd_state['attempts'] += 1
        probability = min(0.5 * self.prd_state['attempts'], 1.0)

        if random.random() < probability:
            self.prd_state['attempts'] = 0
            self.prd_state['success'] = True
            return random.randint(0, n - 1)

        return random.randint(0, n - 1)
```

**Freshness PRD Algorithm**:

```python
class FreshnessController:
    def __init__(self, max_repeats=2, decay_days=30):
        self.max_repeats = max_repeats
        self.decay_days = decay_days

    def calculate_freshness_score(self, product_id, user_history):
        """
        Calculate freshness score using pseudo-random distribution
        Lower score = higher priority (need to show)
        """
        # Count recent views
        recent_views = [
            view for view in user_history
            if view.product_id == product_id and
            (datetime.now() - view.timestamp).days <= self.decay_days
        ]

        if len(recent_views) >= self.max_repeats:
            return float('inf')  # Don't show again

        # Pseudo-random decay based on days since last view
        if recent_views:
            days_since = (datetime.now() - recent_views[-1].timestamp).days
            # PRD: Probability increases with time but caps at 1.0
            probability = min(0.1 * days_since, 1.0)
            return 1.0 - probability  # Lower score = higher priority

        return 0.0  # New product for user, highest priority
```

### Phase 3: A/B Testing Optimization

**PRD for Test Allocation**:

```python
class TestAllocation:
    def __init__(self, test_id, variants):
        self.test_id = test_id
        self.variants = variants
        self.allocations = {v: 0 for v in variants}
        self.target_ratio = {v: 1.0 / len(variants) for v in variants}

    def assign_variant(self, user_id):
        """
        Assign test variant using PRD to maintain balanced allocation
        """
        import hashlib

        # Hash user ID to get consistent assignment
        user_hash = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)

        # Calculate current distribution
        total = sum(self.allocations.values())
        if total == 0:
            current_ratios = {v: 0 for v in self.variants}
        else:
            current_ratios = {
                v: count / total for v, count in self.allocations.items()
            }

        # PRD: Bias toward under-allocated variants
        weights = []
        for variant in self.variants:
            target = self.target_ratio[variant]
            current = current_ratios[variant]
            diff = target - current
            # Amplify bias (PRD)
            weight = max(0.1, 0.5 + diff * 10)
            weights.append(weight)

        # Normalize weights
        total_weight = sum(weights)
        normalized_weights = [w / total_weight for w in weights]

        # Weighted random selection
        r = user_hash % 1000 / 1000.0
        cumulative = 0
        for i, weight in enumerate(normalized_weights):
            cumulative += weight
            if r <= cumulative:
                self.allocations[self.variants[i]] += 1
                return self.variants[i]

        return self.variants[-1]
```

## Results

### 30-Day Metrics

| Metric | Before | After 30 Days | Improvement |
|--------|--------|---------------|-------------|
| CTR | 2.1% | 2.8% | +33% |
| Conversion Rate | 0.8% | 1.1% | +38% |
| Engagement Score | 58 | 71 | +22% |
| Return Rate | 12% | 8.5% | -29% |
| Category Diversity | 0.43 | 0.67 | +56% |

### 90-Day Metrics

| Metric | After 90 Days | Total Improvement |
|--------|---------------|-------------------|
| CTR | 3.2% | +52% |
| Conversion Rate | 1.3% | +63% |
| Engagement Score | 78 | +34% |
| Return Rate | 7.2% | -40% |
| Category Diversity | 0.72 | +67% |

### Additional Benefits

1. **Algorithm Adaptation**: Weights automatically shifted toward content-based filtering as user preferences evolved
2. **Balanced A/B Tests**: All test variants maintained ±2% of target allocation
3. **Reduced Repetition**: Product repeat rate dropped from 18% to 4% within sessions
4. **Discovery Rate**: Users discovered 2.3x more new product categories
5. **User Satisfaction**: Survey score increased from 3.2/5 to 4.1/5

## Technical Implementation Details

### Database Schema

```sql
CREATE TABLE algorithm_weights (
    id SERIAL PRIMARY KEY,
    algorithm VARCHAR(50),
    weight FLOAT,
    user_segment VARCHAR(20),
    effective_date TIMESTAMP,
    performance_metrics JSONB
);

CREATE TABLE product_selection_history (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    product_id BIGINT,
    algorithm_used VARCHAR(50),
    selection_timestamp TIMESTAMP,
    user_action VARCHAR(20), -- click, purchase, skip
    freshness_score FLOAT
);

CREATE TABLE ab_test_allocations (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50),
    variant VARCHAR(50),
    user_id BIGINT,
    assigned_at TIMESTAMP,
    is_valid BOOLEAN
);
```

### Performance Optimizations

1. **Caching**: Algorithm weights cached with 5-minute TTL
2. **Batch Processing**: User history processed in batches of 1000
3. **Async Updates**: Weight updates processed asynchronously via message queue
4. **Database Indexing**: Composite indexes on (user_id, product_id) and (algorithm, date)

## Key Learnings

1. **Start Simple, Iterate Fast**: Initial weights were uniform; optimization came from data-driven adjustments
2. **Segmentation Matters**: Different user segments require different weighting strategies
3. **Balance Exploration/Exploitation**: Too much optimization reduces discovery; too much randomness reduces relevance
4. **Track Everything**: Comprehensive logging enabled post-hoc analysis and optimization
5. **User Feedback Loop**: Implicit signals (clicks, purchases) are more reliable than explicit feedback

## Evolution Path

### Phase 4 (Future): Machine Learning Integration

- Implement bandit algorithms for dynamic weight optimization
- Use reinforcement learning for real-time strategy selection
- Incorporate user clustering for personalized weight profiles

### Phase 5 (Future): Real-Time Adaptation

- Streaming weight updates based on live events
- Seasonal weight adjustments (holiday patterns, sales events)
- A/B test integration with weight system

## Conclusion

The combination of random event weighting and pseudo-random distribution solved the e-commerce platform's recommendation challenges by:

1. **Optimizing algorithm selection** through dynamic, data-driven weighting
2. **Ensuring diversity** through controlled randomness and PRD algorithms
3. **Balancing traffic** in A/B tests with fair, unbiased allocation
4. **Adapting to users** through segment-specific strategies and continuous learning

The solution is scalable, maintainable, and provides measurable business impact. The modular architecture allows for easy extension and experimentation with new algorithms and strategies.

## References

- Weighted Random Selection: Knuth's Algorithm R
- Pseudo-Random Distribution: Warcraft III mechanics
- A/B Testing: Kohavi et al. "Controlled Experiments on the Web"
- Reinforcement Learning: Sutton & Barto "Reinforcement Learning: An Introduction"

## Signals

numerical-design, random, event, weighting, case-study, pseudo-random, distribution, e-commerce, recommendation, a-b-testing, algorithm-selection, category-diversity, freshness-control
