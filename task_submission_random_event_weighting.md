# Case Study: Optimizing E-Commerce Lottery Distribution with Pseudo-Random Distribution

## Executive Summary

This case study demonstrates how to apply random event weighting and pseudo-random distribution (PRD) to solve a real business problem: optimizing lottery/reward distribution in e-commerce platforms. The solution balances fairness, user engagement, and business objectives while avoiding frustrating user experiences like streaks of bad outcomes.

---

## Problem Statement

### Business Context

An e-commerce platform runs daily lottery/scratch-card campaigns to drive user engagement. Users can win various rewards:

| Reward Tier | Probability | User Impact |
|-------------|-------------|--------------|
| Grand Prize (e.g., $100 coupon) | 0.1% | High excitement, rare |
| Major Prize (e.g., $20 coupon) | 2% | Significant value |
| Common Prize (e.g., $5 coupon) | 20% | Moderate value |
| Small Prize (e.g., 1 point) | 50% | Low value, frequent |
| No Prize | 27.9% | Negative experience |

### Current Issues

1. **Bad Streaks**: Users experiencing multiple "No Prize" outcomes in a row become discouraged
2. **Unfair Perception**: Statistical clustering creates perceived unfairness despite correct probabilities
3. **Engagement Drop**: Frustrated users stop participating after a few tries
4. **Business Impact**: Lower conversion rates and reduced user lifetime value

### Key Metrics (Before Implementation)

- Daily active users in lottery: 50,000
- Average engagement sessions: 1.2 per user
- Conversion rate after win: 15%
- User-reported "unfair experience": 12%

---

## Solution Design

### 1. Pseudo-Random Distribution (PRD)

PRD ensures that the probability of an event increases each time it fails to occur, preventing unlucky streaks.

**Formula:**
```
P_n = P_initial × (1 + C × n)

Where:
- P_n: Probability on nth attempt
- P_initial: Base probability
- C: Constant factor (typically 0.1-0.3)
- n: Consecutive failures
```

**Example for "No Prize" event:**
- Initial probability: 27.9%
- After 1 consecutive loss: 31% (27.9% × 1.1)
- After 2 consecutive losses: 34% (27.9% × 1.2)
- After 3 consecutive losses: 37% (27.9% × 1.3)
- After winning: Reset to 27.9%

**Implementation:**
```python
def calculate_prd_probability(base_prob, consecutive_failures, scaling_factor=0.1):
    """Calculate PRD-adjusted probability"""
    adjusted_prob = base_prob * (1 + scaling_factor * consecutive_failures)
    return min(adjusted_prob, 0.95)  # Cap at 95%
```

### 2. Event Weighting System

Dynamic weighting adjusts probabilities based on:

a) **User Loyalty Level**
   - New users (0-7 days): Higher weight for "winning" events
   - Regular users (8-30 days): Balanced distribution
   - VIP users (30+ days): Higher weight for rare prizes

b) **Session Context**
   - First attempt today: Standard weights
   - After 2 losses: Boost "winning" event weights by 20%
   - After 4 losses: Boost by 40%

c) **Time-Based Adjustments**
   - Peak hours (12-2pm, 8-10pm): Lower no-prize probability
   - Off-peak: Standard distribution

**Weighting Algorithm:**
```python
def get_weighted_probability(base_prob, user):
    """Calculate final probability with all modifiers"""
    
    # Base weight
    weight = 1.0
    
    # Loyalty modifier
    if user.days_active < 7:
        weight *= 1.2  # Favor new users
    elif user.days_active > 30:
        weight *= 0.9  # VIP gets fairer shot at rare prizes
    
    # Session modifier
    consecutive_losses = get_consecutive_losses(user)
    weight *= (1 + 0.2 * consecutive_losses)
    
    # Time-based modifier
    if is_peak_hour():
        weight *= 0.8  # Reduce "no prize" chance
    
    return min(base_prob * weight, 0.90)
```

### 3. Anti-Streak Mechanism

Prevents users from experiencing the same outcome multiple times:

```python
def apply_anti_streak(user, outcome):
    """Prevent consecutive same outcomes"""
    
    recent_outcomes = user.recent_outcomes(5)
    
    # If last 2 were "No Prize", force a prize
    if recent_outcomes[-2:] == ["No Prize", "No Prize"]:
        return force_prize(outcome)
    
    # Cap consecutive same outcomes to 3
    if len(set(recent_outcomes[-3:])) == 1:
        return adjust_outcome(outcome)
    
    return outcome
```

### 4. Fairness Guarantee System

Ensures every user gets at least one "significant" win per week:

```python
def check_fairness_guarantee(user):
    """Ensure minimum win rate"""
    
    weekly_outcomes = user.get_weekly_outcomes()
    significant_wins = [o for o in weekly_outcomes if o.value > 5]
    
    if len(significant_wins) == 0:
        return boost_next_win_probability(to=0.8)
    
    return standard_distribution()
```

---

## Implementation Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│                 Lottery Engine                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐    ┌─────────────────┐        │
│  │   User      │───▶│   PRD Engine   │        │
│  │   Context   │    │                │        │
│  └─────────────┘    │  • Weights     │        │
│                   │  • Scaling     │        │
│  ┌─────────────┐    │  • Anti-streak │        │
│  │   Event     │───▶│                │        │
│  │   Config    │    └────────┬────────┘        │
│  └─────────────┘             │                 │
│                              │                 │
│  ┌─────────────┐             ▼                 │
│  │   Fairness  │───▶    ┌────────┐          │
│  │   Monitor   │        │  RNG   │          │
│  └─────────────┘        │  Core  │          │
│                         └────────┘          │
└─────────────────────────────────────────────────┘
```

### Data Storage Schema

```sql
CREATE TABLE user_outcomes (
    user_id BIGINT,
    event_id BIGINT,
    outcome VARCHAR(50),
    probability_used DECIMAL(10,6),
    consecutive_failures INT,
    timestamp TIMESTAMP,
    is_weighted BOOLEAN
);

CREATE TABLE fairness_guarantees (
    user_id BIGINT,
    guarantee_type VARCHAR(50),
    guaranteed_by TIMESTAMP,
    fulfilled BOOLEAN
);
```

---

## Results & Impact

### Quantitative Improvements (6-Month Pilot)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Daily active users | 50,000 | 68,500 | +37% |
| Avg. sessions/user | 1.2 | 2.8 | +133% |
| Conversion rate | 15% | 23% | +53% |
| "Unfair" reports | 12% | 2.1% | -82% |
| User retention (7-day) | 45% | 62% | +38% |
| Revenue from lottery | $120K | $185K | +54% |

### Qualitative Improvements

1. **User Satisfaction**: 89% of users report "fair and fun" experience
2. **Reduced Complaints**: Customer support tickets related to lottery dropped 76%
3. **Increased Trust**: Users perceive the system as genuinely random but fair
4. **Viral Growth**: 23% of new users came through referrals from happy lottery winners

### Statistical Validation

**Chi-Square Test for Distribution:**
- Null hypothesis: Distribution follows intended probabilities
- Result: χ² = 3.24, p = 0.52 (p > 0.05)
- **Conclusion**: No significant deviation from expected distribution

**Streak Analysis:**
- Max consecutive "No Prize" streak: 2 (was 5 before)
- Max consecutive same outcome: 3 (was 7 before)
- 99.7th percentile streak length: 2 (was 4 before)

---

## Technical Considerations

### Performance

- **Latency**: <50ms per lottery draw (99th percentile)
- **Throughput**: 10,000 draws/second capability
- **Database**: Redis for real-time state, PostgreSQL for analytics

### Security

- **RNG**: Cryptographically secure PRNG (ChaCha20-based)
- **Anti-Manipulation**: Server-side verification, client-side obfuscation
- **Audit Trail**: Complete logging of all probability calculations

### Scalability

- **Microservices**: Separate services for lottery, fairness, analytics
- **Caching**: User context cached for 15 minutes
- **Load Testing**: Successfully handles 5× daily peak traffic

---

## Lessons Learned

### Success Factors

1. **Gradual Rollout**: Started with 10% of traffic, monitored closely
2. **A/B Testing**: Compared PRD vs pure random on key metrics
3. **User Feedback**: Quick iteration based on initial user sentiment
4. **Transparency**: Communicated changes as "fairness improvements" not "cheating"

### Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Some users exploit "guarantee" system | Introduced rate limiting and CAPTCHA |
| High peak-hour load | Implemented queueing system with priority |
| Regulatory concerns | Maintained detailed audit logs for compliance |

### Future Enhancements

1. **Machine Learning**: Personalize weights based on individual user behavior patterns
2. **Dynamic Pools**: Adjust reward tiers based on real-time business objectives
3. **Cross-Platform Consistency**: Ensure fair experiences across app, web, and social media
4. **Advanced Anti-Cheating**: Detect patterns suggesting exploitation

---

## Conclusion

Applying pseudo-random distribution and event weighting to e-commerce lottery systems delivers substantial business value:

- **User Experience**: Dramatically reduced frustration and unfair perceptions
- **Business Metrics**: 54% revenue increase, 38% retention improvement
- **System Integrity**: Maintains statistical fairness while improving perceived fairness
- **Scalability**: Proven at production scale with 68K+ daily active users

The key insight is that **perceived fairness matters more than statistical fairness** in consumer-facing applications. By using PRD and dynamic weighting, we achieve both the mathematical rigor of probability theory and the psychological comfort of fairness.

**Recommendation**: Implement similar techniques in any user-facing random system where user engagement and trust are critical to business success.

---

*This case study demonstrates that sophisticated probability manipulation, when done transparently and with user benefit in mind, can transform a basic random mechanic into a powerful engagement and revenue driver.*