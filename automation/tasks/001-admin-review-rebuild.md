# 001 Admin Review Rebuild Flow

## 目标

为 `/admin/prices` 增加一个“核验后重新构建”的安全流程说明，避免用户以为核验后前台立即更新。

## 允许修改

- `automation/results/001-admin-review-rebuild.md`
- 如确有必要，只修改管理后台相关组件和文档

## 验收

1. 管理页明确提示核验后需要重新构建
2. 不引入自动重启
3. 相关测试通过
