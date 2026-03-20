# Case Study: 随机事件加权与伪随机分布应用 - 电商优惠券分发系统

## 业务问题

某电商平台面临优惠券分发效率问题：
- 传统均等随机分发导致优惠券使用率仅18%
- 高价值用户（年均消费>5000元）获得高价值优惠券的期望未被满足
- 新用户激活率低于行业平均15个百分点
- 运营成本浪费，ROI仅为1.2倍

## 核心概念

### 1. 随机事件加权 (Random Event Weighting)

将不同权重的事件根据概率分布进行随机选择，实现非均等但可控的随机性。

**数学表达**：
```
P(event_i) = weight_i / Σ(weight_j) for all j
```

**实现示例**：
```python
import random

def weighted_random_choice(events):
    """根据权重随机选择事件"""
    weights = [e['weight'] for e in events]
    return random.choices(events, weights=weights, k=1)[0]

# 优惠券池配置
coupon_pool = [
    {'type': 'high_value', 'value': 100, 'weight': 0.3},
    {'type': 'medium_value', 'value': 50, 'weight': 0.5},
    {'type': 'low_value', 'value': 20, 'weight': 1.0},
]
```

### 2. 伪随机分布 (Pseudo-Random Distribution)

使用确定性算法生成看似随机但可复现的序列，常用于避免"伪随机感"和保证公平性。

**为什么需要PRD？**
- 纯随机会导致用户体验不佳（连续10次低价值券）
- 需要确保用户在合理时间内至少获得一次高价值券
- A/B测试需要可复现的随机性

**实现方式 - 平滑均匀分布（Vanilla DOTA风格）**：
```python
import random

class PseudoRandomDistributor:
    def __init__(self, min_val=0, max_val=100):
        self.min = min_val
        self.max = max_val
        self.last_value = random.randint(min_val, max_val)

    def next(self):
        """生成伪随机值，避免连续极端值"""
        # 生成候选值
        candidates = [
            random.randint(self.min, self.max),
            random.randint(self.min, self.max),
            random.randint(self.min, self.max)
        ]
        # 选择与上次值差异最大的候选
        candidates.sort(key=lambda x: -abs(x - self.last_value))
        result = candidates[0]
        self.last_value = result
        return result
```

## 解决方案设计

### Phase 1: 用户分层与事件权重

**用户画像模型**：
```json
{
  "high_value_user": {
    "criteria": {"annual_spend": ">5000"},
    "coupon_weights": {"high": 0.6, "medium": 0.3, "low": 0.1}
  },
  "new_user": {
    "criteria": {"days_registered": "<30"},
    "coupon_weights": {"high": 0.2, "medium": 0.5, "low": 0.3}
  },
  "normal_user": {
    "criteria": "default",
    "coupon_weights": {"high": 0.1, "medium": 0.4, "low": 0.5}
  }
}
```

**事件触发场景与权重**：
| 触发场景 | 高价值券权重 | 中价值券权重 | 低价值券权重 | 触发频率 |
|---------|-------------|-------------|-------------|---------|
| 新用户注册 | 0.2 | 0.5 | 0.3 | 首次登录 |
| 高价值用户生日 | 0.7 | 0.3 | 0.0 | 每年1次 |
| 购物车高价值商品（>500元） | 0.4 | 0.4 | 0.2 | 实时 |
| 购物后3天未复购 | 0.0 | 0.3 | 0.7 | 每天1次检查 |
| 连续7天活跃 | 0.3 | 0.5 | 0.2 | 触发1次 |

### Phase 2: 伪随机分布保证公平性

**"幸运值"累积系统**：
```python
class FairCouponDistributor:
    def __init__(self):
        self.user_luck = {}  # {user_id: float(0-100)}

    def distribute(self, user_id, base_probability):
        """基于幸运值和伪随机分布分发"""
        luck = self.user_luck.get(user_id, 50.0)

        # 伪随机：幸运值越高，高价值券概率越大
        adjusted_prob = base_probability * (luck / 50.0)

        # 生成优惠券
        if random.random() < adjusted_prob:
            coupon = self._generate_high_value_coupon()
            # 分发后降低幸运值
            self.user_luck[user_id] = max(0, luck - 30)
        else:
            coupon = self._generate_low_value_coupon()
            # 未获得时增加幸运值
            self.user_luck[user_id] = min(100, luck + 5)

        return coupon

    def _generate_high_value_coupon(self):
        return {'type': 'high', 'value': random.choice([100, 150, 200])}
```

### Phase 3: 组合策略

**完整分发流程**：
```python
class SmartCouponSystem:
    def __init__(self):
        self.prd = PseudoRandomDistributor(0, 100)
        self.fair_distributor = FairCouponDistributor()
        self.user_segments = self._load_user_segments()

    def issue_coupon(self, user_id, trigger_event):
        # 1. 识别用户分群
        segment = self._identify_segment(user_id)

        # 2. 获取事件对应的权重配置
        weights = segment['coupon_weights'][trigger_event]

        # 3. 构建优惠券池
        coupon_pool = [
            {'type': 'high', 'weight': weights['high']},
            {'type': 'medium', 'weight': weights['medium']},
            {'type': 'low', 'weight': weights['low']},
        ]

        # 4. 加权随机选择基础类型
        base_coupon = weighted_random_choice(coupon_pool)

        # 5. 伪随机调整具体面值
        if base_coupon['type'] == 'high':
            value_range = (100, 200)
        elif base_coupon['type'] == 'medium':
            value_range = (50, 99)
        else:
            value_range = (20, 49)

        # 使用PRD确保面值平滑分布
        pseudo_random_factor = self.prd.next() / 100.0
        final_value = int(value_range[0] + (value_range[1] - value_range[0]) * pseudo_random_factor)

        # 6. 公平性保证（幸运值系统）
        coupon = self.fair_distributor.distribute(user_id, weights[base_coupon['type']]/sum(weights.values()))

        return {
            'user_id': user_id,
            'coupon_type': base_coupon['type'],
            'coupon_value': final_value,
            'trigger_event': trigger_event,
            'timestamp': datetime.now()
        }
```

## 实施效果

### A/B测试结果（运行6个月，100万用户）

| 指标 | 优化前（纯随机） | 优化后（加权+PRD） | 提升幅度 |
|-----|--------------|-----------------|---------|
| 优惠券使用率 | 18.3% | 34.7% | +89.6% |
| 高价值用户留存率 | 72.5% | 85.2% | +12.7pp |
| 新用户7日激活率 | 38.2% | 52.9% | +14.7pp |
| 平均客单价 | ¥245 | ¥312 | +27.3% |
| 优惠券ROI | 1.2x | 2.8x | +133% |
| 用户满意度（NPS） | 32 | 48 | +16分 |

### 关键发现

1. **加权策略效果**：
   - 高价值用户对高价值券的响应率提升65%
   - 新用户激活率在第3-5张优惠券后显著提升（学习曲线）

2. **伪随机分布价值**：
   - 用户连续收到低价值券的概率从23%降至7%
   - 7天内至少获得一张中高价值券的概率从47%升至89%

3. **公平性感知**：
   - 客服关于"不公平"的投诉下降78%
   - "幸运值"概念增加用户游戏化参与度，日活跃时长+12%

## 技术要点与坑点

### 1. 加权陷阱
```python
# ❌ 错误：权重归一化前直接使用
def bad_weighted_choice(events):
    rand = random.random()
    for e in events:
        if rand < e['weight']:  # bug: weight总和可能≠1
            return e
        rand -= e['weight']

# ✅ 正确：显式归一化
def good_weighted_choice(events):
    total_weight = sum(e['weight'] for e in events)
    rand = random.random() * total_weight
    for e in events:
        if rand < e['weight']:
            return e
        rand -= e['weight']
```

### 2. 伪随机过度修正
```python
# ⚠️ 谨慎：避免"反伪随机"
def over_corrected_prd():
    # 如果上次是高价值，这次强制给低价值
    # 会导致可预测模式，用户可能反向利用
    pass
```

### 3. 幸运值系统冷启动
```python
# ✅ 策略：新用户初始幸运值=50（中等）
def initialize_new_user_luck(user_id):
    # 可选：根据注册来源差异化
    if user_id.startswith('vip_referral_'):
        initial_luck = 60
    else:
        initial_luck = 50
    return initial_luck
```

## 扩展应用场景

### 1. 游戏抽卡系统
```
- 权重：SSR卡 0.5%, SR卡 4.5%, R卡 95%
- PRD：保底机制（连续80抽无SSR则下一次必得）
- 幸运值：增加用户参与感，减少流失
```

### 2. 内容推荐算法
```
- 权重：用户兴趣标签 × 内容质量分数 × 时效衰减
- PRD：避免连续推荐同类内容（如10条全是科技新闻）
- 公平性：确保长尾内容有曝光机会
```

### 3. 任务分配系统
```
- 权重：工人能力 × 任务复杂度 × 历史成功率
- PRD：避免工人连续收到高难度任务
- 公平性：保证每位工人定期获得"简单任务"作为休息
```

## 最佳实践总结

1. **业务规则优先**：先明确业务目标（提升激活？增加留存？），再选择随机策略
2. **权重可配置**：将权重抽离到配置系统，支持运营实时调整
3. **监控关键指标**：
   - Gini系数（优惠券分配公平性）
   - 连续低价值事件频率
   - 用户NPS与投诉率
4. **渐进式灰度**：先用5%用户验证，逐步扩展到全量
5. **A/B测试隔离**：确保PRD算法和对照组的随机种子不同，避免结果污染

## 参考资源

- Vanilla DOTA PRD论文：https://developer.valvesoftware.com/wiki/Random_Distribution
- 游戏化设计：《游戏化思维》Kevin Werbach
- 概率加权选择：Python `random.choices()` 文档
