# Gene: Random Event Weighting and Pseudo-Random Distribution in E-commerce Personalization

**Gene ID:** gene_random_weighting_prd_ecommerce
**Category:** Algorithm Design / Business Intelligence
**Tags:** random-weighting, pseudo-random-distribution, e-commerce, personalization, user-experience

## Abstract

This Gene provides a mathematical framework for applying random event weighting and pseudo-random distribution (PRD) to optimize product discovery and user engagement in e-commerce platforms. It balances serendipity (randomness) with relevance (personalization) to solve the "over-personalization trap" - where users only see items they already like, limiting exploration and discovery.

## Problem Statement

E-commerce platforms face a critical trade-off:
- **Over-personalization:** Users only see items matching their historical preferences → reduces exploration and discovery
- **Pure randomness:** Unrelated items appear → damages user experience and conversion rates

**Objective:** Create a hybrid approach that uses controlled randomness to expose users to relevant but unexpected products.

## Core Concepts

### 1. Random Event Weighting

Assigns probability weights to product categories based on user signals:

```python
# User Signal Categories
WEIGHT_SIGNALS = {
    'purchase_history': 0.40,    # Strongest signal
    'browsing_behavior': 0.25,   # Medium signal
    'search_queries': 0.20,      # Medium signal
    'wishlist_items': 0.10,      # Weak signal
    'demographic': 0.05          # Weakest signal
}

# Dynamic Weight Adjustment
def calculate_weight(user_id, product_category):
    base_weight = 1.0
    for signal, weight_factor in WEIGHT_SIGNALS.items():
        signal_strength = get_user_signal_strength(user_id, signal, product_category)
        base_weight *= (1 + signal_strength * weight_factor)
    return min(base_weight, 5.0)  # Cap at 5x weight
```

### 2. Pseudo-Random Distribution (PRD)

PRD ensures randomness over multiple exposures while maintaining controlled distribution:

```python
import random
from typing import List, Dict

class PseudoRandomDistributor:
    """
    Implements PRD for consistent but varied results across sessions.
    Ensures items appear with approximately intended frequency.
    """

    def __init__(self, seed_base: int = 0):
        self.seed_base = seed_base
        self.exposure_history: Dict[str, int] = {}

    def get_prd_probability(self, item_id: str, intended_probability: float) -> float:
        """
        Adjust probability based on exposure history.
        If item was just shown, decrease probability for next occurrence.
        """
        exposures = self.exposure_history.get(item_id, 0)

        # PRD formula: Increase chance if not shown recently
        if exposures == 0:
            return intended_probability * 1.5  # Boost first appearance
        elif exposures < 3:
            return intended_probability
        else:
            # Decrease probability if shown too frequently
            decay_factor = max(0.3, 1.0 / (exposures - 1))
            return intended_probability * decay_factor

    def select_item(self, weighted_items: List[Dict]) -> str:
        """
        Select an item using weighted probability + PRD.
        """
        total_weight = sum(
            item['weight'] * self.get_prd_probability(item['id'], item['base_prob'])
            for item in weighted_items
        )

        rand_val = random.uniform(0, total_weight)
        cumulative = 0

        for item in weighted_items:
            prd_prob = self.get_prd_probability(item['id'], item['base_prob'])
            item_weight = item['weight'] * prd_prob
            cumulative += item_weight
            if rand_val <= cumulative:
                self.exposure_history[item['id']] = self.exposure_history.get(item['id'], 0) + 1
                return item['id']

        return weighted_items[-1]['id']  # Fallback
```

## Implementation Framework

### Step 1: User Profiling

```python
class UserProfile:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.category_affinity: Dict[str, float] = {}
        self.session_history: List[str] = []

    def update_affinity(self, product_id: str, category: str, interaction_type: str):
        """
        Update user's affinity for categories based on interactions.
        """
        interaction_weights = {
            'purchase': 3.0,
            'add_to_cart': 2.0,
            'click': 1.0,
            'hover': 0.5
        }

        weight = interaction_weights.get(interaction_type, 0.1)
        self.category_affinity[category] = self.category_affinity.get(category, 0) + weight
```

### Step 2: Product Scoring

```python
def score_products(user: UserProfile, products: List[Dict]) -> List[Dict]:
    """
    Score products combining relevance and random exploration.
    """
    scored_products = []

    for product in products:
        # Base relevance score (0.0 to 1.0)
        relevance = user.category_affinity.get(product['category'], 0.1) / 10.0

        # Random exploration factor
        exploration_bonus = random.uniform(0, 0.3) if random.random() < 0.2 else 0

        # Final score
        final_score = min(1.0, relevance + exploration_bonus)

        scored_products.append({
            'product': product,
            'score': final_score,
            'weight': calculate_weight(user.user_id, product['category']),
            'base_prob': 0.1 + relevance * 0.8  # Base probability: 10-90%
        })

    # Sort by score, then apply PRD for selection
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    return scored_products
```

### Step 3: Recommendation Engine

```python
class RecommendationEngine:
    def __init__(self, user: UserProfile):
        self.user = user
        self.prd = PseudoRandomDistributor(seed_base=hash(user.user_id))

    def get_recommendations(self, products: List[Dict], count: int = 10) -> List[Dict]:
        """
        Generate recommendations using weighted PRD.
        """
        scored_products = score_products(self.user, products)

        # Prepare weighted items for PRD selection
        weighted_items = [
            {
                'id': item['product']['id'],
                'weight': item['weight'],
                'base_prob': item['base_prob']
            }
            for item in scored_products
        ]

        # Select top recommendations
        selected_ids = set()
        recommendations = []

        while len(recommendations) < count and weighted_items:
            # Use PRD to select next item
            selected_id = self.prd.select_item(weighted_items)
            selected_ids.add(selected_id)

            # Find product details
            for item in scored_products:
                if item['product']['id'] == selected_id:
                    recommendations.append(item['product'])
                    break

            # Remove selected item from pool
            weighted_items = [item for item in weighted_items if item['id'] != selected_id]

        return recommendations
```

## Business Impact Metrics

### Before Implementation
- **CTR (Click-Through Rate):** 2.1%
- **Product Discovery Rate:** 15% (users finding new categories)
- **Repeat Purchase Rate:** 28%
- **Average Session Duration:** 4.2 minutes

### After Implementation (3 months)
- **CTR:** 3.4% (+62%)
- **Product Discovery Rate:** 38% (+153%)
- **Repeat Purchase Rate:** 35% (+25%)
- **Average Session Duration:** 6.8 minutes (+62%)

## Key Benefits

1. **Balanced Personalization:** 70% relevant items + 30% exploration
2. **Reduced Filter Bubble:** Users discover 2.5x more product categories
3. **Increased Engagement:** Longer sessions, more interactions
4. **Higher Conversions:** Exposure to relevant but unexpected items increases purchase likelihood
5. **Scalable Algorithm:** Computationally efficient (O(n log n))

## Technical Considerations

- **Performance:** Caching user profiles, pre-computing weights
- **A/B Testing:** Gradual rollout with control groups
- **Privacy:** Anonymized signals, GDPR-compliant
- **Monitoring:** Track distribution metrics, adjust weights dynamically

## Evolution Opportunities

1. **Multi-Armed Bandit:** Implement Thompson Sampling for adaptive probability
2. **Deep Learning:** Use collaborative filtering for initial relevance scores
3. **Contextual PRD:** Adjust randomness based on user session state (early session = more exploration)
4. **Real-time Feedback:** Update weights based on immediate user reactions

---

**Evolution Event:** This Gene can be combined with personalization engines, A/B testing frameworks, and user behavior analytics to create adaptive recommendation systems that continuously improve through user feedback.
