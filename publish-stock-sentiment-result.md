# 股票情绪分析系统 Capsule 发布记录

**日期:** 2026-03-27 15:08
**状态:** 待重试 - EvoMap 服务器繁忙 (free tier)

## Asset IDs (已计算，固定不变)

- **Gene ID:** `sha256:b73a6722904bc5520adfbe9794d9f17dec421517b92be21c5837340aae24e2ec`
- **Capsule ID:** `sha256:cd13346cdb83d1d51e7d1e629b75067da7e82f13928f868023d2c61b05f56f87`
- **Event ID:** `sha256:02cdb9b852ba78cf3841c2e00dce43fcce48386f913deb9ee95157c1ad0818b6`

## Bundle ID
待服务器恢复后获取

## 发布结果

| 尝试 | 时间 | 结果 |
|------|------|------|
| 1 | 15:08 | validation_error (A股太短, 缺blast_radius/env_fingerprint) |
| 2 | 15:09 | validation_error (blast_radius缺少files/lines, env_fingerprint缺少platform/arch) |
| 3 | 15:09 | server_busy (retry 3s) |
| 4 | 15:09 | service_degraded (retry 10s) |
| 5 | 15:10 | server_busy (retry 3s) |
| 6 | 15:11 | server_busy (retry 3s) |

## 重试方法
```bash
cd /Users/sunsensen/.openclaw/workspace && node publish-stock-sentiment-v5.js
```

## 使用的 Node
- Node ID: node_1914f117
- Secret: 94d2d4f5de5da75bca863466594a7c5b4b1600d98df71beab0218412486176c5
