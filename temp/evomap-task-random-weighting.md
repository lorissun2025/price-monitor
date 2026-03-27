# 案例：电商推荐系统的随机展示平衡

## 业务背景

某电商平台拥有100万SKU，需要为首页展示位选择推荐商品。面临以下挑战：

1. **商业目标冲突**：
   - 需要最大化点击率（CTR）和转化率（CVR）
   - 需要确保新商品有机会获得曝光
   - 需要避免用户审美疲劳
   - 需要保证长尾商品不被埋没

2. **传统方案问题**：
   - 纯推荐算法：高相关性商品长期占据展示位，新商品难以出头
   - 纯随机展示：用户体验差，点击率下降50%+
   - 固定比例：无法动态调整，难以平衡短期和长期目标

## 解决方案：加权随机 + 伪随机分布

### 1. 随机事件权重设计

将推荐候选池分为三个层级，分配不同权重：

```python
weight_config = {
    'high_intent': {
        'weight': 0.60,      # 60%展示高意向商品（CTR预测>8%）
        'pool_size': 20,     # 从20个候选中选
        'signals': ['search_history', 'recent_view', 'purchase_history']
    },
    'new_discovery': {
        'weight': 0.25,      # 25%展示新商品（上架<7天）
        'pool_size': 50,     # 从50个候选中选
        'signals': ['category_match', 'price_range', 'brand_affinity']
    },
    'long_tail': {
        'weight': 0.15,      # 15%展示长尾商品（曝光<100次）
        'pool_size': 100,    # 从100个候选中选
        'signals': ['cold_start', 'niche_interest', 'diversity']
    }
}
```

**关键设计点**：
- 权重总和为1.0，确保展示比例可控
- 每层独立随机，避免头部商品垄断
- 池子大小递增，保证多样性

### 2. 伪随机分布实现

使用分层伪随机确保结果可控且可复现：

```python
import hashlib
import random
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class RecommendationSlot:
    position: int
    user_id: str
    timestamp: int
    category: str

class WeightedRandomSelector:
    def __init__(self, seed_salt: str = "recsys_v1"):
        """
        伪随机种子：确保相同输入产生相同输出
        seed_salt: 业务版本号，用于A/B测试隔离
        """
        self.seed_salt = seed_salt

    def _deterministic_hash(self, user_id: str, position: int, seed: str) -> float:
        """
        生成确定性哈希值 [0,1)
        相同user_id + position + seed 必然返回相同值
        """
        hash_input = f"{user_id}_{position}_{seed}_{self.seed_salt}"
        hash_bytes = hashlib.md5(hash_input.encode()).digest()
        hash_int = int.from_bytes(hash_bytes[:4], byteorder='big')
        return hash_int / (2**32)

    def select_layer(self, slot: RecommendationSlot) -> str:
        """
        根据伪随机哈希选择展示层级
        """
        hash_val = self._deterministic_hash(slot.user_id, slot.position, "layer_select")

        # 累积概率分布
        cumulative = 0.0
        for layer, config in weight_config.items():
            cumulative += config['weight']
            if hash_val < cumulative:
                return layer

        return 'high_intent'  # fallback

    def select_item(self, layer: str, pool: List[Dict], slot: RecommendationSlot) -> Dict:
        """
        在选定层级中伪随机选择具体商品
        """
        if not pool:
            return None

        pool_size = len(pool)
        hash_val = self._deterministic_hash(slot.user_id, slot.position, f"item_{layer}")

        index = int(hash_val * pool_size) % pool_size
        return pool[index]

# 使用示例
selector = WeightedRandomSelector()

# 为用户生成8个展示位的推荐
user_id = "user_12345678"
recommendations = []

for position in range(8):
    slot = RecommendationSlot(
        position=position,
        user_id=user_id,
        timestamp=int(time.time()),
        category="homepage"
    )

    # 1. 选择层级
    layer = selector.select_layer(slot)

    # 2. 获取该层候选池（实际从数据库/缓存读取）
    pool = get_candidate_pool(layer, user_id)

    # 3. 选择具体商品
    item = selector.select_item(layer, pool, slot)

    recommendations.append({
        'position': position,
        'layer': layer,
        'item': item,
        'item_id': item['item_id'] if item else None
    })

print(f"层级分布: {[r['layer'] for r in recommendations]}")
# 示例输出: ['high_intent', 'new_discovery', 'high_intent', 'high_intent',
#           'long_tail', 'high_intent', 'high_intent', 'new_discovery']
```

### 3. 实际业务效果

**A/B测试结果（30天，10万用户）**：

| 指标 | 传统算法 | 加权随机方案 | 提升幅度 |
|------|---------|------------|---------|
| CTR | 3.2% | 4.1% | +28% |
| CVR | 0.8% | 1.1% | +38% |
| 新商品曝光率 | 2% | 15% | +650% |
| 用户复购率（30天） | 18% | 23% | +28% |
| 长尾商品GMV贡献 | 8% | 14% | +75% |

**关键洞察**：

1. **短期收益**：高意向商品占60%，保证核心流量变现能力
2. **长期收益**：25%新商品曝光引入新鲜感，减少用户流失
3. **生态健康**：15%长尾曝光避免"马太效应"，促进商品多样性

### 4. 伪随机的核心价值

#### 4.1 可调试性
```python
# 问题排查：用户反馈"每次看到的商品都一样"
debug_hash = selector._deterministic_hash("user_12345678", 0, "layer_select")
print(f"首个展示位的层级选择哈希: {debug_hash}")
# 输出: 0.652 -> 对应 new_discovery 层
```

可以精确复现任何用户在任何位置的选择过程。

#### 4.2 A/B测试隔离
```python
# 实验组A
selector_a = WeightedRandomSelector(seed_salt="exp_a_2025")

# 实验组B（调整权重）
selector_b = WeightedRandomSelector(seed_salt="exp_b_2025")

# 相同用户在两个组看到不同结果，但各自组内结果稳定
```

#### 4.3 灰度发布
```python
# 逐步放量：5% -> 20% -> 100%
def get_selector(user_id):
    user_hash = int(user_id[-8:], 16) % 100
    if user_hash < 5:
        return WeightedRandomSelector(seed_salt="v2_pilot")
    elif user_hash < 25:
        return WeightedRandomSelector(seed_salt="v2_gray")
    else:
        return WeightedRandomSelector(seed_salt="v1_stable")
```

## 扩展应用

### 场景2：游戏掉率控制

```python
# 问题：纯随机导致"脸黑"玩家体验极差
# 解决：基于时间窗口的伪随机

class LootBoxRNG:
    def __init__(self):
        self.player_pity_counters = {}  # 保底计数器
        self.pity_threshold = 100  # 100次后必出

    def roll(self, player_id: str, base_rate: float = 0.01) -> bool:
        """
        base_rate: 基础掉率1%
        实际掉率随失败次数递增，直到保底触发
        """
        counter = self.player_pity_counters.get(player_id, 0)
        self.player_pity_counters[player_id] = counter + 1

        # 伪随机递增掉率
        boosted_rate = min(base_rate * (1 + counter * 0.05), 1.0)

        # 确定性哈希
        hash_val = self._deterministic_hash(
            f"{player_id}_{counter}_{self.player_pity_counters[player_id]}"
        )

        if hash_val < boosted_rate:
            self.player_pity_counters[player_id] = 0  # 重置
            return True

        # 保底机制
        if counter >= self.pity_threshold - 1:
            self.player_pity_counters[player_id] = 0
            return True

        return False
```

效果：玩家流失率降低15%，ARPU提升12%。

### 场景3：负载均衡请求分发

```python
# 问题：后端服务器性能差异，均匀分配导致慢服务器雪崩
# 解决：基于响应时间的动态权重

class DynamicLoadBalancer:
    def __init__(self, servers: List[str]):
        self.servers = servers
        self.server_weights = {s: 1.0 for s in servers}
        self.last_select = {}  # 记录上次选择，避免热点

    def select_server(self, request_hash: str) -> str:
        """
        根据伪随机哈希 + 动态权重选择服务器
        """
        # 计算总权重
        total_weight = sum(self.server_weights.values())

        # 确定性哈希
        hash_val = self._hash_request(request_hash)
        scaled_hash = hash_val * total_weight

        # 加权选择
        cumulative = 0.0
        for server, weight in self.server_weights.items():
            cumulative += weight
            if scaled_hash < cumulative:
                return server

        return self.servers[0]

    def update_weights(self, latency_report: Dict[str, float]):
        """
        根据最近延迟动态调整权重
        """
        avg_latency = sum(latency_report.values()) / len(latency_report)

        for server, latency in latency_report.items():
            # 延迟越高，权重越低
            new_weight = max(0.1, avg_latency / latency)
            self.server_weights[server] = new_weight
```

效果：P99延迟降低40%，错误率降低60%。

## 总结

### 核心原则

1. **伪随机 > 纯随机**
   - 确定性：相同输入→相同输出
   - 可复现：便于调试和问题排查
   - 可控性：通过seed隔离不同实验

2. **权重设计 > 固定比例**
   - 动态调整：根据业务指标优化权重
   - 分层隔离：避免头部资源垄断
   - 多目标平衡：短期收益 + 长期生态

3. **业务驱动 > 技术炫技**
   - 先明确业务目标
   - 再设计技术方案
   - 最后用A/B验证效果

### 实施建议

1. **小步快跑**：先在5%流量灰度，验证核心假设
2. **监控指标**：CTR、CVR、用户留存、多样性指数
3. **快速迭代**：每周调整一次权重配置，持续优化

### 适用场景

- ✅ 需要平衡短期和长期目标的推荐系统
- ✅ 需要保证公平性的资源分配（广告位、曝光机会）
- ✅ 需要避免"脸黑"体验的游戏机制
- ✅ 需要动态权重的负载均衡
- ✅ 需要A/B测试隔离的实验框架

---

**关键词**: random-event-weighting, pseudo-random-distribution, deterministic-hash, weighted-selection, business-case-study
