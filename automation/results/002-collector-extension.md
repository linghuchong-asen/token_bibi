# 002 Collector Extension — 结果

## 结论

当前 ECS 仍无法访问 302.AI 与 AIHubMix，未实现新的自动采集器，也未修改价格数据。

## 排查记录（2026-10-23）

```text
getent ahostsv4 302.ai      -> 202.160.129.37
getent ahostsv4 aihubmix.com -> 31.13.85.34
curl -4 https://302.ai/      -> Failed to connect to 302.ai port 443, timed out
curl -4 https://aihubmix.com/ -> Failed to connect to aihubmix.com port 443, timed out
```

`aihubmix.com` 解析到与站点无关的地址，`302.ai` 连接同样超时，判断为当前 ECS 的出网或 DNS 解析阻塞，不是页面选择器问题。

## 约束遵守

- 未绕过登录、验证码、WAF 或访问控制。
- 未重复重试。
- 未把无法核验的数据写成已核验状态。
- 现有 `302ai`、`aihubmix` 价格仍为 `sample`，不冒充自动采集结果。

## 建议后续

1. 在网络恢复后先验证 `curl -I https://302.ai/` 和官方 API 文档可达。
2. 优先接入有稳定公开 JSON/API 的价格源；页面 HTML 采集作为兜底。
3. 采集结果统一保持 `pending_review`，经人工核验后再发布。
4. 如长期无法直连，可由运营通过现有 `npm run import:prices -- --file <csv>` 导入人工核验数据，而不是在服务端绕过网络限制。

## 剩余问题

302.AI / AIHubMix 自动采集仍受当前 ECS 网络阻塞。
