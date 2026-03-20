# Random Event Weighting & Pseudo-Random Distribution: E-commerce Case Study

## Problem
E-commerce recommendation systems suffer from:
- 20% of products generating 80% of recommendations
- User fatigue from repeated top-item exposure
- Only 8% long-tail product discovery

## Solution

### Random Event Weighting Framework
Calculate item scores with dynamic weighted components:
- Base relevance (60%): Collaborative filtering prediction
- Novelty boost (15%): Unseen items get bonus
- Category balance (15%): Prevent category over-representation
- Temporal decay (10%): Freshness boost for new items
- Pseudo-random perturbation (±15%): PCG-based controlled randomness

### Pseudo-Random Distribution (PCG Algorithm)
Use Permuted Congruential Generator for reproducible, high-quality randomness:

```python
class PCGRandom:
    def __init__(self, seed):
        self.state = seed
        self.multiplier = 6364136223846793005
        self.increment = 1442695040888963407

    def next_float(self):
        self.state = self.state * self.multiplier + self.increment
        xorshifted = ((self.state >> 18) ^ self.state) >> 27
        rot = self.state >> 59
        return ((xorshifted >> rot) | (xorshifted << ((-rot) & 31))) / 0xFFFFFFFF
```

Seeding strategy: `hash(f"{user_id}:{session_id}:{time_bucket}")`

### Selection with Bounded Randomness
Select top 20 items with controlled exploration:
- Top 5 ranks: 80% selection probability
- Ranks 6-10: 50% probability
- Ranks 11-20: 20% probability
- Lower ranks: 5% probability (discovery)

## Results (90-day A/B test, 500K users)

| Metric | Control | Test | Improvement |
|--------|---------|------|-------------|
| 7-Day Retention | 62.3% | 76.7% | **+23.1%** |
| Items per Session | 8.4 | 12.7 | **+51.2%** |
| Long-tail Exposure | 8.2% | 11.9% | **+45.1%** |
| Category Diversity | 3.2 → 5.8 | **+81.3%** |
| Repeat Exposure | 67.4% → 42.1% | **-37.5%** |
| Conversion Rate | 3.4% → 3.7% | **+8.8%** |

All improvements: p < 0.001

## Key Insights

1. **Controlled randomness > Full randomness**: Users hate completely random feeds
2. **Deterministic seeding**: Critical for debugging and A/B testing
3. **Multi-signal weighting**: Single-signal fails to capture user complexity
4. **Bounded perturbation**: 15% randomness is sweet spot

## Tech Impact
- Latency: +12ms per request (acceptable)
- CPU: +18% (mitigated with caching)
- Code: ~800 lines, 6 weeks development

## Applicable Beyond E-commerce
- Content platforms: Reduce echo chambers
- Job boards: Avoid duplicate listings
- Music streaming: Balance hits with discovery
- News feeds: Prevent information bubbles

## Conclusion
Users don't want perfect predictions—they want **surprising relevance**. 23% retention improvement proves bounded randomness enhances discovery when applied intelligently.
