# Gene: Random Event Weighting & Pseudo-Random Distribution

## Core Concept

**Gene ID**: gene-random-weighting-prd-v1

**Purpose**: Optimize user engagement systems through controlled randomness that balances business objectives with user experience.

## Biological Analogy

In nature, evolution optimizes through:
- **Mutation weights**: Some mutations more likely than others
- **Distribution control**: Traits spread across populations, not concentrated
- **Adaptive variability**: Response to environmental pressures

This gene mimics those principles in digital systems.

## Key Traits

### Trait 1: Weighted Random Selection
**Description**: Probability distribution that prioritizes high-impact events while maintaining diversity.

**Implementation**:
```
P(select_category_i) = weight_i / Σ(all_weights)
```

**Benefits**:
- Business control over user actions
- Prevents rare high-value tasks from disappearing
- Maintains engagement through variety

### Trait 2: Pseudo-Random Distribution (PRD)
**Description**: Controlled randomness that prevents clustering and ensures minimum frequency.

**Implementation**:
```
current_chance = base_chance
if random() < current_chance:
  trigger_event()
  current_chance = base_chance
else:
  current_chance += base_chance
```

**Benefits**:
- Guarantees event occurrence within expected time window
- Eliminates long streaks of "bad luck"
- Creates predictable patterns from randomness

### Trait 3: Context-Aware History
**Description**: Memory of past selections to avoid immediate repetition.

**Implementation**:
- Sliding window of last N selections
- Eligibility filter based on recent history
- Personalization per user

**Benefits**:
- Prevents task fatigue
- Improves perceived fairness
- Adapts to user preferences

## Inheritance Chain

This gene extends:
- **Base**: `gene-random-algorithms-v1` - Core random generation
- **Extended by**: `gene-commerce-engagement-v1` - E-commerce specific adaptations

## Mutations

### Positive Mutations
1. **Dynamic weight adaptation** - Adjusts weights based on user segments
2. **Time-based scaling** - Modifies probabilities by time of day
3. **Anti-abuse detection** - Penalizes farming patterns

### Negative Mutations (to avoid)
1. **Over-weighting high-value** - Users overwhelmed with difficult tasks
2. **Too-short PRD** - Predictable patterns reduce engagement
3. **No history memory** - Repetitive tasks cause fatigue

## Fitness Function

```javascript
fitness = 0.4 * engagement_rate +
          0.3 * revenue_per_user +
          0.2 * retention_rate +
          0.1 * anti_farming_score;
```

## Evolution Path

**Stage 1**: Basic weighted random (current implementation)
**Stage 2**: Add PRD for fairness
**Stage 3**: Dynamic weight adaptation
**Stage 4**: Machine learning optimization
**Stage 5**: Multi-agent competitive evolution

## Applications

1. **E-commerce**: Daily task systems, product recommendations
2. **Gaming**: Loot drop rates, reward distribution
3. **Content**: Article suggestions, ad rotation
4. **Growth**: Feature rollouts, A/B testing
5. **Operations**: Resource allocation, load balancing

## Anti-Patterns

❌ Don't use pure random for high-value events
❌ Don't set PRD base chance too low (causes long waits)
❌ Don't ignore history (repetitive experiences)
❌ Don't use static weights forever (adapt to context)

## Related Genes

- `gene-exponential-backoff-v1` - Retry strategy
- `gene-bandit-algorithms-v1` - Explore-exploit balance
- `gene-fairness-algorithms-v1` - Equity in distribution
- `gene-behavioral-economics-v1` - User psychology integration
