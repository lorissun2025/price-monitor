#!/usr/bin/env python3
"""
Random Event Weighting & Pseudo-Random Distribution
Case Study: Game Economy Loot System Implementation

This capsule demonstrates practical implementation of:
1. Weighted random selection for loot tables
2. Pseudo-random distribution with controlled variance
3. Pity system to guarantee rare drops
4. Dynamic adjustment based on player progression
"""

import random
import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class Rarity(Enum):
    COMMON = 1
    UNCOMMON = 2
    RARE = 3
    EPIC = 4
    LEGENDARY = 5


@dataclass
class LootItem:
    id: str
    name: str
    rarity: Rarity
    base_weight: float
    min_level: int = 1
    max_level: int = 99


class WeightedRandomSystem:
    """
    Implements weighted random selection with controlled probability distributions.
    Ensures fair distribution while maintaining excitement.
    """
    
    def __init__(self):
        self.player_level = 1
        self.pity_counters = {rarity: 0 for rarity in Rarity}
        self.pity_thresholds = {
            Rarity.EPIC: 50,
            Rarity.LEGENDARY: 100
        }
        self.recent_drops = []
        self.max_streak_prevention = 5
        
    def generate_loot_table(self, loot_items: List[LootItem]) -> List[LootItem]:
        """
        Generate weighted loot table filtered by player level.
        """
        return [item for item in loot_items 
                if self.player_level >= item.min_level 
                and self.player_level <= item.max_level]
    
    def calculate_weights(self, loot_items: List[LootItem]) -> Dict[str, float]:
        """
        Calculate adjusted weights based on:
        1. Base weight from rarity
        2. Pity counter adjustments
        3. Recent drop streak prevention
        """
        weights = {}
        total_base_weight = sum(item.base_weight for item in loot_items)
        
        for item in loot_items:
            # Start with base weight
            weight = item.base_weight
            
            # Pity system: increase weight for rare items when threshold approaches
            pity_factor = self._calculate_pity_factor(item.rarity)
            weight *= (1 + pity_factor)
            
            # Streak prevention: reduce weight if recently dropped
            streak_penalty = self._calculate_streak_penalty(item.id)
            weight *= (1 - streak_penalty)
            
            weights[item.id] = max(0.01, weight)  # Ensure minimum weight
            
        return weights
    
    def _calculate_pity_factor(self, rarity: Rarity) -> float:
        """Calculate pity bonus factor based on drop history."""
        if rarity not in self.pity_thresholds:
            return 0.0
        
        counter = self.pity_counters[rarity]
        threshold = self.pity_thresholds[rarity]
        
        if counter >= threshold * 0.8:
            return 3.0  # Significantly increased chance near threshold
        elif counter >= threshold * 0.5:
            return 1.5  # Moderately increased chance
        else:
            return 0.0
    
    def _calculate_streak_penalty(self, item_id: str) -> float:
        """Calculate penalty for recent duplicate drops."""
        recent_count = sum(1 for drop in self.recent_drops[-10:] 
                          if drop == item_id)
        
        if recent_count >= self.max_streak_prevention:
            return 0.7  # 70% reduction in weight
        elif recent_count >= 3:
            return 0.3  # 30% reduction
        else:
            return 0.0
    
    def weighted_random_select(self, loot_items: List[LootItem]) -> Optional[LootItem]:
        """
        Select an item using weighted random distribution.
        """
        if not loot_items:
            return None
        
        weights = self.calculate_weights(loot_items)
        
        # Normalize weights
        total_weight = sum(weights.values())
        if total_weight == 0:
            return None
        
        normalized_weights = {
            item_id: w / total_weight 
            for item_id, w in weights.items()
        }
        
        # Weighted random selection
        items = {item.id: item for item in loot_items}
        item_ids = list(items.keys())
        probabilities = [normalized_weights[item_id] for item_id in item_ids]
        
        selected_id = random.choices(item_ids, weights=probabilities, k=1)[0]
        selected_item = items[selected_id]
        
        # Update counters
        self._update_counters(selected_item)
        
        return selected_item
    
    def _update_counters(self, item: LootItem):
        """Update pity counters and recent drops."""
        # Increment pity counters
        for rarity in Rarity:
            if rarity.value < item.rarity.value:
                self.pity_counters[rarity] += 1
            else:
                self.pity_counters[rarity] = 0
        
        # Track recent drops
        self.recent_drops.append(item.id)
        if len(self.recent_drops) > 20:
            self.recent_drops.pop(0)


class PseudoRandomGenerator:
    """
    Implements pseudo-random distribution with controlled variance.
    Prevents long streaks of good or bad luck.
    """
    
    def __init__(self, seed: Optional[int] = None):
        self.rng = random.Random(seed)
        self.expected_value = 0.5
        self.actual_average = 0.5
        self.history = []
        self.window_size = 100
        
    def generate(self, target_probability: float) -> bool:
        """
        Generate boolean result with controlled variance around target probability.
        """
        # Generate base random value
        raw_random = self.rng.random()
        
        # Apply variance control
        adjusted_result = self._apply_variance_control(raw_random, target_probability)
        
        # Update statistics
        self.history.append(adjusted_result)
        if len(self.history) > self.window_size:
            self.history.pop(0)
        
        self.actual_average = sum(self.history) / len(self.history) if self.history else 0.5
        
        return adjusted_result
    
    def _apply_variance_control(self, raw_value: float, target: float) -> bool:
        """
        Adjust random value to prevent long streaks.
        """
        deviation = self.actual_average - target
        
        # If running below average, slightly increase success chance
        if deviation < -0.1:
            adjusted = raw_value + abs(deviation) * 0.5
        # If running above average, slightly decrease success chance
        elif deviation > 0.1:
            adjusted = raw_value - abs(deviation) * 0.5
        else:
            adjusted = raw_value
        
        # Clamp to valid range
        adjusted = max(0.0, min(1.0, adjusted))
        
        return adjusted < target


def create_sample_loot_table() -> List[LootItem]:
    """Create sample loot table for demonstration."""
    return [
        LootItem("c001", "Health Potion", Rarity.COMMON, 50.0),
        LootItem("u001", "Mana Potion", Rarity.COMMON, 45.0),
        LootItem("u002", "Iron Sword", Rarity.UNCOMMON, 30.0),
        LootItem("r001", "Golden Ring", Rarity.RARE, 15.0),
        LootItem("e001", "Dragon Scale", Rarity.EPIC, 5.0),
        LootItem("l001", "Ancient Artifact", Rarity.LEGENDARY, 1.0),
    ]


def run_simulation(loot_system: WeightedRandomSystem, iterations: int = 1000) -> Dict:
    """
    Run simulation to demonstrate the system in action.
    """
    loot_table = create_sample_loot_table()
    results = {rarity: 0 for rarity in Rarity}
    
    for _ in range(iterations):
        loot_system.player_level = random.randint(1, 50)
        filtered_table = loot_system.generate_loot_table(loot_table)
        
        if filtered_table:
            item = loot_system.weighted_random_select(filtered_table)
            if item:
                results[item.rarity] += 1
    
    total = sum(results.values())
    percentages = {
        rarity.name: (count / total * 100) if total > 0 else 0
        for rarity, count in results.items()
    }
    
    return {
        "total_drops": total,
        "rarity_distribution": results,
        "percentages": percentages,
        "average_actual": loot_system.actual_average
    }


if __name__ == "__main__":
    # Demonstrate the system
    print("=== Random Event Weighting & Pseudo-Random Distribution ===\n")
    
    # Initialize systems
    loot_system = WeightedRandomSystem()
    prng = PseudoRandomGenerator(seed=42)
    
    # Run simulation
    print("Running simulation with 1000 drops...")
    simulation_results = run_simulation(loot_system, iterations=1000)
    
    print(f"\nResults after {simulation_results['total_drops']} drops:")
    for rarity, count in simulation_results['rarity_distribution'].items():
        percentage = simulation_results['percentages'][rarity]
        print(f"  {rarity.name}: {count} ({percentage:.2f}%)")
    
    print(f"\nActual average (target 0.5): {simulation_results['average_actual']:.3f}")
    
    # Demonstrate pity system
    print("\n=== Pity System Demonstration ===")
    print("Forcing legendary pity threshold...")
    for i in range(95):
        loot_system.pity_counters[Rarity.LEGENDARY] = i + 1
    
    final_drops = []
    for _ in range(10):
        loot_table = create_sample_loot_table()
        item = loot_system.weighted_random_select(loot_table)
        if item:
            final_drops.append(item)
    
    print(f"\nLast 10 drops after 95 pity counter:")
    for i, item in enumerate(final_drops):
        print(f"  {i+1}. {item.name} ({item.rarity.name})")
