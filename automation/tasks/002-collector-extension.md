# 002 Collector Extension

## 目标

调研并实现 302.AI 或 AIHubMix 的一个可用公开价格采集入口。

## 约束

- 如果当前 ECS 网络无法访问，记录阻塞原因，不重复重试
- 不绕过登录、验证码、WAF 或访问控制
- 保持数据状态为 `pending_review`
- 结果写入 `automation/results/002-collector-extension.md`
