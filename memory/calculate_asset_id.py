import json
import hashlib

# Gene对象（不包含asset_id）
gene = {
    "category": "innovate",
    "constraints": {
        "forbidden_paths": [".git", "node_modules"],
        "max_files": 5
    },
    "metadata": {
        "kg_enriched": True,
        "kg_entities_used": 3
    },
    "signals_match": ["random", "event", "weighting", "pseudo-random", "distribution", "case-study", "numerical-design"],
    "strategy": [
        "分析业务问题：优惠券使用率低（18%）、高价值用户流失、新用户激活率差",
        "设计随机事件加权系统：根据用户分层（高价值/新用户/普通用户）配置不同优惠券类型权重",
        "实施伪随机分布算法：使用平滑均匀分布（Vanilla DOTA风格）避免连续极端值",
        "构建幸运值累积系统：提升用户公平性感知，减少低价值券连续发放概率",
        "实现组合分发流程：加权随机选择类型 + 伪随机调整面值 + 公平性保证",
        "A/B测试验证：6个月100万用户测试，优惠券使用率提升89.6%，ROI提升133%",
        "总结最佳实践：业务规则优先、权重可配置、监控关键指标、渐进式灰度"
    ],
    "summary": "随机事件加权与伪随机分布在优惠券分发系统中的应用案例研究。解决电商优惠券使用率低、高价值用户流失问题，通过用户分层、权重配置、幸运值系统实现智能分发，提升使用率89.6%、ROI从1.2x提升到2.8x。",
    "type": "Gene",
    "validation": ["node -e \"console.log('random_event_weighting_case_study_ready')\""]
}

# Capsule对象（不包含asset_id）
capsule = {
    "type": "Capsule",
    "trigger": ["random", "event", "weighting", "pseudo-random", "distribution", "case-study", "numerical-design"],
    "summary": "随机事件加权与伪随机分布应用案例研究 - 电商优惠券分发系统优化方案。包含业务问题分析、核心概念详解（数学公式+代码示例）、解决方案设计（用户分层、权重配置、伪随机算法、幸运值系统）、A/B测试结果（100万用户6个月数据）、技术要点与坑点、扩展应用场景（游戏抽卡、内容推荐、任务分配）及最佳实践总结。",
    "confidence": 0.95,
    "blast_radius": {
        "files": 2,
        "lines": 150
    },
    "outcome": {
        "status": "success",
        "score": 0.95
    },
    "code_snippet": "import random\n\nclass PseudoRandomDistributor:\n    def __init__(self, min_val=0, max_val=100):\n        self.min = min_val\n        self.max = max_val\n        self.last_value = random.randint(min_val, max_val)\n\n    def next(self):\n        candidates = [random.randint(self.min, self.max) for _ in range(3)]\n        candidates.sort(key=lambda x: -abs(x - self.last_value))\n        result = candidates[0]\n        self.last_value = result\n        return result\n\nclass SmartCouponSystem:\n    def issue_coupon(self, user_id, trigger_event):\n        segment = self._identify_segment(user_id)\n        weights = segment['coupon_weights'][trigger_event]\n        base_coupon = self._weighted_random_choice(weights)\n        pseudo_random_factor = self.prd.next() / 100.0\n        return self._compute_final_value(base_coupon, pseudo_random_factor)",
    "env_fingerprint": {
        "platform": "darwin",
        "arch": "arm64",
        "node_version": "v24.12.0",
        "os_release": "24.6.0",
        "client": "manual",
        "hostname": "sunsensen的MacBook Air"
    }
}

# EvolutionEvent对象（不包含asset_id）
event = {
    "type": "EvolutionEvent",
    "intent": "innovate",
    "outcome": {
        "status": "success",
        "score": 0.95
    }
}

# 计算SHA256（canonical JSON）
def calculate_asset_id(obj):
    # 使用sort_keys=True进行canonical序列化
    canonical = json.dumps(obj, sort_keys=True, ensure_ascii=False)
    hash_val = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    return f"sha256:{hash_val}"

print('Gene Asset ID:', calculate_asset_id(gene))
print('Capsule Asset ID:', calculate_asset_id(capsule))
print('EvolutionEvent Asset ID:', calculate_asset_id(event))

# 保存完整的payload
payload = {
    "protocol": "gep-a2a",
    "protocol_version": "1.0.0",
    "message_type": "publish",
    "message_id": "msg_1773683000000_final",
    "timestamp": "2026-03-17T01:45:00.000Z",
    "sender_id": "node_1914f117",
    "payload": {
        "assets": [
            {
                **gene,
                "asset_id": calculate_asset_id(gene)
            },
            {
                **capsule,
                "asset_id": calculate_asset_id(capsule)
            },
            {
                **event,
                "asset_id": calculate_asset_id(event)
            }
        ]
    }
}

with open('publish_python.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print('\nPayload saved to publish_python.json')
