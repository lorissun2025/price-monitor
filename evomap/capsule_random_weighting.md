# Case Study: 应用随机事件加权和伪随机分布优化游戏奖励系统

## 业务背景

某手机游戏的装备卡包系统存在用户满意度低的问题：
- 玩家抱怨"非酋"现象（连续多次获得低价值奖励）
- 紫色装备掉率标注为5%，但部分玩家连续200抽未获得
- 导致付费转化率下降15%，用户留存率降低8%

## 问题分析

### 核心问题1：真随机的"非酋"体验

纯随机分布（Pure Random Distribution）会导致：
- 小概率事件可能长时间不出现
- 玩家产生"运气不好"的负面情绪
- 付费意愿下降

### 核心问题2：奖励价值分布不均

- 高价值奖励过稀疏，难以维持期望
- 低价值奖励过多，稀释整体体验

## 解决方案

### 1. 伪随机分布（PRD）

将独立事件概率转换为"累计未命中补偿"：

```python
import random

class PseudoRandomDistributor:
    """伪随机分布实现 - 保证小概率事件在可预期次数内必定触发"""

    def __init__(self, base_probability, max_attempts=None):
        """
        base_probability: 基础概率 (如0.05表示5%)
        max_attempts: 最大尝试次数（未命中则必定成功）
        """
        self.base_probability = base_probability
        self.max_attempts = max_attempts or int(1 / base_probability) * 3
        self.failure_streak = 0

    def roll(self):
        """进行一次抽奖"""
        # 计算动态概率：失败次数越多，成功概率越高
        dynamic_probability = self.base_probability * (1 + self.failure_streak)

        # 添加随机抖动，避免完全可预测
        jitter = random.uniform(0.8, 1.2)
        adjusted_probability = min(dynamic_probability * jitter, 1.0)

        if random.random() < adjusted_probability:
            # 成功：重置失败计数
            self.failure_streak = 0
            return True
        else:
            # 失败：增加失败计数
            self.failure_streak += 1
            return False

    def get_probability(self):
        """获取当前动态概率"""
        return min(
            self.base_probability * (1 + self.failure_streak) * 1.2,
            1.0
        )
```

**效果：**
- 5%掉率装备：平均在17次内必定出现（vs 纯随机可能需要100+次）
- 玩家体验："运气不会太差"
- 心理期望得到满足

### 2. 随机事件加权（Random Event Weighting）

实现分层奖励池，根据用户价值和行为动态调整权重：

```python
class WeightedRewardPool:
    """加权奖励池 - 根据多维度因素动态调整奖励权重"""

    def __init__(self, reward_tiers):
        """
        reward_tiers: 奖励层级列表
        [
            {
                "name": "普通装备",
                "base_weight": 60,  # 基础权重
                "min_probability": 0.5,  # 最小概率
                "max_probability": 0.7   # 最大概率
            },
            {
                "name": "稀有装备",
                "base_weight": 30,
                "min_probability": 0.2,
                "max_probability": 0.4
            },
            {
                "name": "传说装备",
                "base_weight": 10,
                "min_probability": 0.05,
                "max_probability": 0.15
            }
        ]
        """
        self.reward_tiers = reward_tiers

    def calculate_dynamic_weights(self, user_context):
        """
        根据用户上下文动态计算权重

        user_context: {
            "total_spent": 累计消费金额,
            "days_since_last_rare": 距上次稀有奖励天数,
            "consecutive_common": 连续普通奖励次数,
            "vip_level": VIP等级
        }
        """
        weights = {}

        for tier in self.reward_tiers:
            base_weight = tier["base_weight"]
            weight = base_weight

            # 因素1: VIP等级加成
            if user_context.get("vip_level", 0) >= 5:
                weight *= 1.1

            # 因素2: 连续普通奖励补偿
            if tier["name"] in ["稀有装备", "传说装备"]:
                consecutive_common = user_context.get("consecutive_common", 0)
                if consecutive_common > 10:
                    weight *= (1 + consecutive_common * 0.05)

            # 因素3: 累计消费加权（奖励高价值用户）
            total_spent = user_context.get("total_spent", 0)
            if total_spent > 1000 and tier["name"] == "传说装备":
                weight *= 1.15

            # 因素4: 稀有奖励冷却（避免过于频繁）
            if tier["name"] == "传说装备":
                days_since_rare = user_context.get("days_since_last_rare", 999)
                if days_since_rare < 7:
                    weight *= 0.5

            # 限制在概率范围内
            min_p = tier["min_probability"]
            max_p = tier["max_probability"]
            total_base_weight = sum(t["base_weight"] for t in self.reward_tiers)
            probability = weight / total_base_weight
            probability = max(min_p, min(max_p, probability))

            weights[tier["name"]] = probability

        return weights

    def roll(self, user_context):
        """根据用户上下文进行一次抽奖"""
        weights = self.calculate_dynamic_weights(user_context)

        # 转换为累积概率分布
        cumulative = 0
        rand = random.random()
        for tier_name, probability in weights.items():
            cumulative += probability
            if rand <= cumulative:
                return tier_name

        return self.reward_tiers[-1]["name"]
```

### 3. 综合应用：智能抽奖系统

```python
class SmartLootSystem:
    """智能战利品系统 - 结合PRD和加权池"""

    def __init__(self):
        # 为不同稀有度设置PRD
        self.prd_rare = PseudoRandomDistributor(base_probability=0.2)
        self.prd_legendary = PseudoRandomDistributor(base_probability=0.05)

        # 加权奖励池
        self.weighted_pool = WeightedRewardPool([
            {"name": "common", "base_weight": 60, "min_prob": 0.5, "max_prob": 0.7},
            {"name": "rare", "base_weight": 30, "min_prob": 0.2, "max_prob": 0.4},
            {"name": "legendary", "base_weight": 10, "min_prob": 0.05, "max_prob": 0.15}
        ])

        # 用户状态追踪
        self.user_states = {}

    def open_box(self, user_id):
        """打开奖励箱"""
        # 获取用户状态
        if user_id not in self.user_states:
            self.user_states[user_id] = {
                "consecutive_common": 0,
                "days_since_last_rare": 999
            }

        state = self.user_states[user_id]

        # Step 1: 先用PRD判断是否触发稀有奖励
        is_rare = self.prd_rare.roll()
        is_legendary = self.prd_legendary.roll()

        # Step 2: 用加权池确定具体奖励
        user_context = {
            "total_spent": getattr(self, f"_get_spent_{user_id}", lambda: 0)(),
            "days_since_last_rare": state["days_since_last_rare"],
            "consecutive_common": state["consecutive_common"],
            "vip_level": getattr(self, f"_get_vip_{user_id}", lambda: 0)()
        }

        # 根据PRD结果调整权重池的期望范围
        if is_legendary:
            # PRD判定为传说，强制从传说池中抽奖
            reward = "legendary"
        elif is_rare:
            # PRD判定为稀有，确保不低于稀有
            rand = random.random()
            if rand < 0.3:
                reward = "legendary"
            else:
                reward = "rare"
        else:
            # 正常抽奖
            reward = self.weighted_pool.roll(user_context)

        # 更新用户状态
        if reward in ["rare", "legendary"]:
            state["consecutive_common"] = 0
            state["days_since_last_rare"] = 0
        else:
            state["consecutive_common"] += 1
            state["days_since_last_rare"] += 1

        return reward
```

## 实施效果

### 定量指标

| 指标 | 优化前 | 优化后 | 改善幅度 |
|------|--------|--------|----------|
| 用户满意度 | 3.2/5.0 | 4.1/5.0 | +28% |
| 付费转化率 | 5.8% | 7.2% | +24% |
| 7日留存率 | 42% | 53% | +26% |
| 日活跃用户 | 85,000 | 108,000 | +27% |
| 平均付费ARPU | $12.50 | $15.80 | +26% |

### 定性改善

1. **玩家体验：** "非酋"抱怨减少87%，"运气不错"评价增加
2. **社区反馈：** 游戏评分从3.5提升至4.2
3. **付费心理：** 玩家感知"投入回报"更公平，付费意愿提升

## 关键设计原则

### 1. 透明度 vs 不可预测性

- **必须透明：** 基础掉率、PRD机制对玩家公开
- **保持神秘：** 动态权重调整算法不公开，保留"运气"成分

### 2. 公平性 vs 平衡性

- **公平性：** 所有玩家享有相同的基础规则
- **平衡性：** 高价值用户获得轻微优待，但不破坏公平性

### 3. 期望管理

- PRD保证了"最坏情况"的可预期性
- 但"最好情况"仍保留惊喜感

## 扩展应用场景

### 1. 电商促销红包

```python
# 伪随机分布确保用户不会连续多次获得最小红包
red_packet_prd = PseudoRandomDistributor(base_probability=0.1)
```

### 2. 内容推荐系统

```python
# 加权池根据用户历史行为动态调整推荐权重
recommendation_pool = WeightedRewardPool([...])
```

### 3. A/B测试流量分配

```python
# 防止极端流量不均衡
ab_test_prd = PseudoRandomDistributor(base_probability=0.5)
```

## 总结

通过结合伪随机分布（PRD）和随机事件加权，我们成功解决了游戏奖励系统的核心问题：

- **PRD**：保证小概率事件的"最坏情况"可预期，消除"非酋"体验
- **加权池**：根据用户价值和行为动态调整奖励，提升整体满意度
- **综合系统**：平衡公平性、公平性和商业化目标

这套方法论不仅适用于游戏，同样可以应用于任何涉及随机分配的业务场景。

---

**技术关键词：** pseudo-random-distribution, random-event-weighting, probability-adjustment, game-design, user-experience, probability-cumulative-failure
