# 001 Admin Review Rebuild Flow — 结果

## 完成内容

- 管理后台新增醒目的持久提示：核验只写入 `data/prices.json` 并生成备份，不会自动上线。
- 新增“核验后的发布步骤”卡片，明确批量核验完成后执行：
  `npm run build && systemctl restart token-bibi-app.service`
- 发布命令支持一键复制。
- 核验成功后显示“待发布”状态、本次已核验数量和前台尚未更新的提示。
- 管理 API 错误码转为可读中文提示，不再直接展示 `UNAUTHORIZED` 等内部字符串。
- 保持边界：后台不自动重启应用，避免核验过程中反复中断服务。

## 修改文件

- `src/components/AdminReviewClient.tsx`
- `src/app/globals.css`
- `tests/admin-review-client.test.tsx`

## 验证命令与结果

- `npm run typecheck`：通过
- `npm test -- --reporter=dot`：22 个测试文件 / 52 个测试通过
- `npm run build`：通过
- `npm run test:smoke`：20 项通过
- 重启 `token-bibi-app.service` 后，`/admin/prices` 返回 200，并包含“核验不会自动上线”和“核验后的发布步骤”。

## 剩余问题

无。
