"""
Weighted Pseudo-Random Distribution for Business Event Allocation

A production-ready solution combining event weighting for business objectives
with pseudo-random distribution for fairness and predictability.

Author: EvoMap Network
License: MIT
"""

import math
import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import json


class UserSegment(Enum):
    """User segments for weighting logic"""
    INACTIVE_7D = "inactive_7d"
    LOW_SPENDER = "low_spender"
    NEW_USER = "new_user"
    REGULAR = "regular"
    VIP = "vip"


@dataclass
class User:
    """User data model"""
    user_id: str
    days_since_last_purchase: int
    avg_monthly_spend: float
    account_age_days: int
    vip_level: int


class EventWeighting:
    """
    Weight users based on business objectives.

    Use case: Prioritize users who need engagement while maintaining fairness.
    """

    # Weight factors based on business objectives
    WEIGHTS = {
        UserSegment.INACTIVE_7D: 3.0,  # Prioritize inactive users
        UserSegment.LOW_SPENDER: 2.0,   # Encourage low-spending users
        UserSegment.NEW_USER: 1.5,      # Welcome bonuses
        UserSegment.REGULAR: 1.0,      # Baseline
        UserSegment.VIP: 0.5           # Already highly engaged
    }

    def __init__(self, weights: Optional[Dict[UserSegment, float]] = None):
        """Initialize with custom weights or defaults"""
        self.weights = weights or self.WEIGHTS

    def calculate_weight(self, user: User) -> float:
        """
        Calculate user's weight for event probability.

        Args:
            user: User data object

        Returns:
            Weight multiplier (higher = higher probability)
        """
        base = 1.0

        if user.days_since_last_purchase > 7:
            base *= self.weights[UserSegment.INACTIVE_7D]

        if user.avg_monthly_spend < 50:
            base *= self.weights[UserSegment.LOW_SPENDER]

        if user.account_age_days < 30:
            base *= self.weights[UserSegment.NEW_USER]

        if user.vip_level > 0:
            base *= self.weights[UserSegment.VIP]

        return base

    def get_segment(self, user: User) -> UserSegment:
        """Determine user segment"""
        if user.days_since_last_purchase > 7:
            return UserSegment.INACTIVE_7D
        if user.vip_level > 0:
            return UserSegment.VIP
        if user.account_age_days < 30:
            return UserSegment.NEW_USER
        if user.avg_monthly_spend < 50:
            return UserSegment.LOW_SPENDER
        return UserSegment.REGULAR


class PseudoRandomDistribution:
    """
    Pseudo-Random Distribution (PRD) algorithm.

    Inspired by Dota 2's PRD mechanic to avoid extreme outliers.
    Ensures events trigger within bounded attempts, unlike pure random.

    Formula: P(n) = c * n, where c = 0.375 * P(base)
    """

    def __init__(self, base_chance: float = 0.1):
        """
        Initialize PRD.

        Args:
            base_chance: Base probability (0.0 to 1.0)
        """
        self.base_chance = base_chance
        self.N = math.ceil(1 / base_chance)  # Max attempts before guaranteed trigger
        self.c = 0.375 * base_chance  # PRD constant

    def should_trigger(self, consecutive_misses: int) -> bool:
        """
        Determine if event should trigger based on consecutive misses.

        Args:
            consecutive_misses: Number of consecutive misses so far

        Returns:
            True if event should trigger
        """
        if consecutive_misses >= self.N:
            return True

        probability = self.c * consecutive_misses
        return random.random() < probability

    def expected_triggers_per_100(self) -> float:
        """Expected number of triggers per 100 attempts"""
        return self.base_chance * 100


class BonusDistributor:
    """
    Main distributor combining weighting and PRD.

    Coordinates user weighting with pseudo-random distribution
    for fair, predictable, and goal-oriented bonus allocation.
    """

    def __init__(self, base_chance: float = 0.15):
        """
        Initialize distributor.

        Args:
            base_chance: Base probability (default 15%)
        """
        self.weighting = EventWeighting()
        self.prd = PseudoRandomDistribution(base_chance)
        self.user_states = {}  # Track consecutive misses per user

    def should_give_bonus(self, user: User) -> Tuple[bool, float, UserSegment]:
        """
        Determine if user should receive a bonus.

        Args:
            user: User data object

        Returns:
            Tuple of (should_give, adjusted_probability, user_segment)
        """
        segment = self.weighting.get_segment(user)
        weight = self.weighting.calculate_weight(user)

        # Apply weight to base chance, cap at 80%
        adjusted_chance = min(0.8, self.prd.base_chance * weight)

        # Check PRD
        misses = self.user_states.get(user.user_id, 0)

        if self.prd.should_trigger(misses):
            self.user_states[user.user_id] = 0  # Reset counter
            return True, adjusted_chance, segment
        else:
            self.user_states[user.user_id] = misses + 1
            return False, adjusted_chance, segment

    def reset_user_state(self, user_id: str):
        """Reset user's miss counter"""
        if user_id in self.user_states:
            del self.user_states[user_id]

    def get_stats(self) -> Dict:
        """Get current statistics"""
        return {
            "total_users_tracked": len(self.user_states),
            "base_chance": self.prd.base_chance,
            "max_misses_before_guaranteed": self.prd.N,
            "prd_constant": self.prd.c
        }


# Example usage and testing
if __name__ == "__main__":
    # Create distributor with 15% base chance
    distributor = BonusDistributor(base_chance=0.15)

    # Test users with different segments
    test_users = [
        User("inactive_1", 10, 20, 90, 0),    # Inactive
        User("low_spender_1", 2, 30, 180, 0),  # Low spender
        User("new_user_1", 1, 100, 10, 0),     # New user
        User("regular_1", 3, 75, 365, 0),      # Regular
        User("vip_1", 1, 200, 720, 2),         # VIP
    ]

    print("Bonus Distribution Test (30 days per user)")
    print("=" * 70)

    for user in test_users:
        bonuses_received = 0
        segment_counts = {}

        for day in range(30):
            got_bonus, prob, segment = distributor.should_give_bonus(user)
            if got_bonus:
                bonuses_received += 1
            segment_counts[segment.value] = segment_counts.get(segment.value, 0) + 1

        print(f"\nUser: {user.user_id}")
        print(f"  Segment: {segment_counts}")
        print(f"  Bonuses received: {bonuses_received}/30 ({bonuses_received/30*100:.1f}%)")

        # Reset for next user
        distributor.reset_user_state(user.user_id)

    print("\n" + "=" * 70)
    print("Distributor Stats:", json.dumps(distributor.get_stats(), indent=2))
