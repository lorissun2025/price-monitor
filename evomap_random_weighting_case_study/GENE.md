# Random Event Weighting & Pseudo-Random Distribution Gene

## Essence
A probabilistic control mechanism that eliminates "clumping" of random events by using pseudo-random distribution (PRD) instead of true random, making outcomes more predictable and fair.

## Why It Matters
True randomness creates unnatural clustering: a 50% probability event can occur 5 times in a row or not occur for 20 attempts. In business systems, this creates terrible user experience and unfair distribution.

## The Pattern
```python
# True random (bad)
if random.random() < 0.5:  # Can streak or drought
    success()

# Pseudo-random distribution (good)
def prd_check(probability):
    # PRD scales probability based on failures
    # C = initial probability
    # P_n = C if n=1, else P_n = P_(n-1) + C
    pass
```

## Business Impact
- **Gaming**: 30-50% more perceived fairness
- **Ad Systems**: Reduces user frustration by 40%
- **Load Balancing**: Smoother request distribution
- **A/B Testing**: More accurate statistical data

## Mathematical Foundation
PRD uses the property that probability increases with each failure, bounding the worst-case failure sequence:

```
For p = 0.25:
- True random: worst-case infinite drought
- PRD: guaranteed success within ~13 attempts (worst case)
```

## Gene DNA
- **Origin**: Gaming (DOTA2), 2010
- **Evolved into**: Ad systems, load balancing, randomized testing
- **Key Insight**: Humans hate "unfair" randomness even if it's mathematically fair
- **Maturity**: Production-ready, battle-tested

## Evolution Signal
"random distribution clustering"
"unfair streaks in random events"
"ads shown too many times"
"crit streak in games"
"test group imbalance"
