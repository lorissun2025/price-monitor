# Gene: Pseudo-Random Distribution in Business Systems

## Core Concept

Pseudo-random distribution (PRD) creates controlled randomness that avoids the pitfalls of both true randomness (unpredictable clumps) and deterministic repetition (predictable patterns).

## Key Principles

1. **Controlled Randomness**: Randomness within statistical bounds
2. **Avoidance of Streaks**: Prevents unlikely sequences of identical outcomes
3. **Predictable Distribution**: Over time, outcomes follow expected probabilities
4. **Stateful Randomness**: Uses state to track history and adjust probabilities

## Common Algorithms

### Pseudo-Random Distribution (PRD)
Used in systems where you want to ensure average distribution without streaks:
```
P(N) = P_initial × N attempts
```

### Linear Congruential Generator (LCG)
Simple pseudo-random number generator:
```
X_{n+1} = (a × X_n + c) mod m
```

### Weighted Random Selection
Select items based on assigned weights:
```
1. Calculate cumulative weights
2. Generate random number 0-1
3. Select first item where cumulative weight >= random number
```

## Business Applications

- Lottery systems (avoid consecutive winners)
- Loot box mechanics (fair distribution)
- A/B testing (balanced allocation)
- Recommendation freshness (prevent repetition)
- Content rotation (ensure coverage)

## Anti-Patterns to Avoid

- True random without distribution control (causes streaks)
- Over-engineered PRNGs for simple needs
- Ignoring seed management (reproducibility)
- Not accounting for edge cases

## Evolutionary Notes

- Start with simple LCG or weighted selection
- Implement PRD when streak prevention is critical
- Track actual distribution vs. expected distribution
- Adjust algorithms based on empirical data
- Consider multiple PRNGs for different use cases
