"""
Weighted Random Distribution System
===================================

一个完整的加权随机系统实现，支持：
- 加权随机选择
- 伪随机分布（确定性种子）
- 预算控制
- 自适应权重
- 性能优化

作者: EvoMap Agent
版本: 1.0.0
"""

import random
import math
import hashlib
import bisect
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import json
from abc import ABC, abstractmethod


class WeightStrategy(Enum):
    """权重计算策略"""
    LINEAR = "linear"           # 线性权重
    LOGARITHMIC = "logarithmic"  # 对数权重（平滑差异）
    EXPONENTIAL = "exponential"  # 指数权重（放大差异）
    SOFTMAX = "softmax"          # Softmax归一化


@dataclass
class WeightedItem:
    """带权重的选项"""
    id: str
    value: Any
    base_weight: float
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class SelectionResult:
    """选择结果"""
    item: WeightedItem
    selected_weight: float
    random_value: float
    seed: str
    context: Dict[str, Any]


class WeightCalculator(ABC):
    """权重计算器抽象基类"""

    @abstractmethod
    def calculate(self, items: List[WeightedItem], **kwargs) -> List[float]:
        pass


class LinearWeightCalculator(WeightCalculator):
    """线性权重计算器"""

    def calculate(self, items: List[WeightedItem], **kwargs) -> List[float]:
        return [item.base_weight for item in items]


class LogarithmicWeightCalculator(WeightCalculator):
    """对数权重计算器（防止极端差异）"""

    def calculate(self, items: List[WeightedItem], **kwargs) -> List[float]:
        return [math.log1p(item.base_weight) for item in items]


class ExponentialWeightCalculator(WeightCalculator):
    """指数权重计算器（放大差异）"""

    def __init__(self, exponent: float = 2.0):
        self.exponent = exponent

    def calculate(self, items: List[WeightedItem], **kwargs) -> List[float]:
        return [item.base_weight ** self.exponent for item in items]


class SoftmaxWeightCalculator(WeightCalculator):
    """Softmax权重计算器（温度参数控制平滑度）"""

    def __init__(self, temperature: float = 1.0):
        self.temperature = temperature

    def calculate(self, items: List[WeightedItem], **kwargs) -> List[float]:
        weights = [item.base_weight for item in items]
        exp_weights = [math.exp(w / self.temperature) for w in weights]
        total = sum(exp_weights)
        return [ew / total for ew in exp_weights]


class WeightAdjuster(ABC):
    """权重调整器抽象基类"""

    @abstractmethod
    def adjust(self, items: List[WeightedItem], weights: List[float],
               context: Dict[str, Any]) -> List[float]:
        pass


class UserFactorAdjuster(WeightAdjuster):
    """基于用户因子的权重调整器"""

    def adjust(self, items: List[WeightedItem], weights: List[float],
               context: Dict[str, Any]) -> List[float]:
        user_factor = context.get('user_factor', 1.0)
        return [w * user_factor for w in weights]


class BudgetConstraintAdjuster(WeightAdjuster):
    """预算约束调整器"""

    def adjust(self, items: List[WeightedItem], weights: List[float],
               context: Dict[str, Any]) -> List[float]:
        remaining_budget = context.get('remaining_budget', float('inf'))

        # 过滤超出预算的选项
        valid_weights = []
        for item, weight in zip(items, weights):
            cost = item.metadata.get('cost', 0)
            if cost <= remaining_budget:
                valid_weights.append(weight)
            else:
                valid_weights.append(0.0)

        return valid_weights


class WeightedRandomSystem:
    """加权随机系统核心类"""

    def __init__(self,
                 weight_calculator: WeightCalculator = None,
                 weight_adjusters: List[WeightAdjuster] = None):
        self.weight_calculator = weight_calculator or LinearWeightCalculator()
        self.weight_adjusters = weight_adjusters or []
        self._cache = {}

    def normalize_weights(self, weights: List[float]) -> List[float]:
        """归一化权重"""
        total = sum(weights)
        if total == 0:
            return [1.0 / len(weights)] * len(weights)
        return [w / total for w in weights]

    def build_cdf(self, weights: List[float]) -> List[float]:
        """构建累积分布函数"""
        cdf = []
        cumulative = 0.0
        for w in weights:
            cumulative += w
            cdf.append(cumulative)
        return cdf

    def calculate_weights(self,
                         items: List[WeightedItem],
                         context: Dict[str, Any] = None) -> List[float]:
        """计算最终权重"""
        context = context or {}

        # 1. 基础权重
        weights = self.weight_calculator.calculate(items, **context)

        # 2. 权重调整
        for adjuster in self.weight_adjusters:
            weights = adjuster.adjust(items, weights, context)

        # 3. 归一化
        return self.normalize_weights(weights)

    def select(self,
              items: List[WeightedItem],
              seed: Optional[str] = None,
              context: Dict[str, Any] = None) -> SelectionResult:
        """
        加权随机选择

        Args:
            items: 可选项列表
            seed: 随机种子（用于确定性结果）
            context: 上下文信息

        Returns:
            SelectionResult: 选择结果
        """
        if not items:
            raise ValueError("Items list cannot be empty")

        context = context or {}

        # 1. 计算权重
        weights = self.calculate_weights(items, context)

        # 2. 构建CDF
        cdf = self.build_cdf(weights)

        # 3. 生成伪随机数
        if seed is not None:
            random.seed(self._hash_seed(seed))
        random_value = random.random()

        # 4. 二分查找选择
        idx = bisect.bisect_left(cdf, random_value)
        idx = min(idx, len(items) - 1)  # 边界保护

        # 5. 返回结果
        return SelectionResult(
            item=items[idx],
            selected_weight=weights[idx],
            random_value=random_value,
            seed=seed,
            context=context.copy()
        )

    def select_batch(self,
                    items: List[WeightedItem],
                    count: int,
                    seed: Optional[str] = None,
                    allow_duplicates: bool = False,
                    context: Dict[str, Any] = None) -> List[SelectionResult]:
        """
        批量选择

        Args:
            items: 可选项列表
            count: 选择数量
            seed: 随机种子
            allow_duplicates: 是否允许重复
            context: 上下文信息

        Returns:
            List[SelectionResult]: 选择结果列表
        """
        if count > len(items) and not allow_duplicates:
            raise ValueError(f"Cannot select {count} items from {len(items)} without duplicates")

        results = []
        available_items = items.copy()

        for i in range(count):
            batch_seed = f"{seed}_{i}" if seed else None
            result = self.select(available_items, seed=batch_seed, context=context)
            results.append(result)

            if not allow_duplicates:
                available_items.remove(result.item)

        return results

    def _hash_seed(self, seed: str) -> int:
        """将种子字符串转换为整数"""
        hash_obj = hashlib.sha256(seed.encode())
        return int(hash_obj.hexdigest(), 16) % (2 ** 32)

    def clear_cache(self):
        """清除缓存"""
        self._cache.clear()


class BudgetControlledSelector:
    """带预算控制的随机选择器"""

    def __init__(self,
                 weighted_system: WeightedRandomSystem,
                 total_budget: float):
        self.weighted_system = weighted_system
        self.total_budget = total_budget
        self.used_budget = 0.0

    @property
    def remaining_budget(self) -> float:
        return self.total_budget - self.used_budget

    def select_with_budget(self,
                           items: List[WeightedItem],
                           seed: Optional[str] = None,
                           context: Dict[str, Any] = None) -> Optional[SelectionResult]:
        """在预算约束下选择"""
        context = context or {}
        context['remaining_budget'] = self.remaining_budget

        result = self.weighted_system.select(items, seed=seed, context=context)

        cost = result.item.metadata.get('cost', 0)
        if cost <= self.remaining_budget:
            self.used_budget += cost
            return result
        else:
            return None

    def reset_budget(self):
        """重置预算"""
        self.used_budget = 0.0


# ==================== 便利函数 ====================

def weighted_choice(items: List[Any],
                   weights: List[float],
                   seed: Optional[str] = None) -> Any:
    """
    简单的加权随机选择

    Args:
        items: 选项列表
        weights: 权重列表
        seed: 随机种子

    Returns:
        选中的项
    """
    weighted_items = [
        WeightedItem(id=str(i), value=item, base_weight=weight)
        for i, (item, weight) in enumerate(zip(items, weights))
    ]

    system = WeightedRandomSystem()
    result = system.select(weighted_items, seed=seed)
    return result.item.value


def weighted_sample(items: List[Any],
                  weights: List[float],
                  k: int,
                  seed: Optional[str] = None) -> List[Any]:
    """
    加权随机采样（无重复）

    Args:
        items: 选项列表
        weights: 权重列表
        k: 采样数量
        seed: 随机种子

    Returns:
        选中的项列表
    """
    weighted_items = [
        WeightedItem(id=str(i), value=item, base_weight=weight)
        for i, (item, weight) in enumerate(zip(items, weights))
    ]

    system = WeightedRandomSystem()
    results = system.select_batch(
        weighted_items,
        count=k,
        seed=seed,
        allow_duplicates=False
    )

    return [r.item.value for r in results]


# ==================== 示例使用 ====================

def example_ecoupon_system():
    """电商优惠券系统示例"""

    # 定义优惠券选项
    discount_items = [
        WeightedItem(
            id="discount_5",
            value="5% off",
            base_weight=10,
            metadata={"cost": 5, "max_discount": 5}
        ),
        WeightedItem(
            id="discount_10",
            value="10% off",
            base_weight=30,
            metadata={"cost": 10, "max_discount": 10}
        ),
        WeightedItem(
            id="discount_15",
            value="15% off",
            base_weight=40,
            metadata={"cost": 15, "max_discount": 15}
        ),
        WeightedItem(
            id="discount_20",
            value="20% off",
            base_weight=15,
            metadata={"cost": 20, "max_discount": 20}
        ),
        WeightedItem(
            id="discount_30",
            value="30% off",
            base_weight=5,
            metadata={"cost": 30, "max_discount": 30, "vip_only": True}
        )
    ]

    # 创建系统
    system = WeightedRandomSystem(
        weight_adjusters=[UserFactorAdjuster()]
    )

    # 为不同用户分配优惠券
    users = [
        {"id": "user_001", "user_factor": 0.5, "tier": "bronze"},
        {"id": "user_002", "user_factor": 1.0, "tier": "silver"},
        {"id": "user_003", "user_factor": 2.0, "tier": "gold"}
    ]

    for user in users:
        result = system.select(
            discount_items,
            seed=f"{user['id']}_2026_week11",
            context=user
        )
        print(f"{user['id']} ({user['tier']}): {result.item.value}")

    return system


def example_budget_control():
    """预算控制示例"""

    items = [
        WeightedItem("item_a", "Value A", 30, {"cost": 50}),
        WeightedItem("item_b", "Value B", 50, {"cost": 100}),
        WeightedItem("item_c", "Value C", 20, {"cost": 200}),
    ]

    system = WeightedRandomSystem()
    selector = BudgetControlledSelector(system, total_budget=300)

    print(f"初始预算: {selector.total_budget}")

    # 尝试选择多个
    selections = []
    for i in range(10):
        result = selector.select_with_budget(items, seed=f"batch_{i}")
        if result:
            selections.append(result)
            print(f"选择 {i+1}: {result.item.value} (成本: {result.item.metadata['cost']})")
            print(f"剩余预算: {selector.remaining_budget}")
        else:
            print(f"选择 {i+1}: 预算不足")
            break

    return selections


if __name__ == "__main__":
    print("=== 电商优惠券系统示例 ===")
    example_ecoupon_system()

    print("\n=== 预算控制示例 ===")
    example_budget_control()
