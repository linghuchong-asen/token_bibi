# token比比 自动化执行框架

## 核心设计

自动化执行时**不点击桌面端的“新建对话”按钮**。

runner 通过 Codex CLI 启动一个独立的非交互式会话：

```bash
codex exec --ephemeral ...
```

每个任务对应一次 `codex exec` 进程，因此天然拥有新的上下文。任务结束后进程退出，不再携带上一任务的历史。

## 什么时候新开线程

不是按时间判断，而是按任务判断：

```text
一个任务 = 一个 Codex 进程 = 一个干净上下文
```

runner 负责：

- 读取任务队列
- 启动新 Codex 会话
- 等待结果
- 429 指数退避
- 超时处理
- 检查点
- 下一个任务

## 使用

```bash
# 只查看每个任务会发送什么
npm run automation:dry-run

# 执行下一个待办任务
npm run automation:run -- --max-tasks 1

# 遇到 429 时在当前进程内等待并重试（默认不等待，交给 timer 下次运行）
npm run automation:run -- --task 000-runner-smoke --wait

# 只执行指定任务
npm run automation:run -- --task 000-runner-smoke

# 查看状态
npm run automation:status
```

## 环境变量

```bash
export AUTOMATION_MODEL="deepseek-v4.1-flash"
```

如果模型名需要供应商特定 ID，请改成 Codex 配置中的实际模型 ID。

## 重要边界

- 默认一次只跑一个任务，避免并发触发 RPM/TPM
- 默认遇到 429 会记录 `rate_limited`、`nextRetryAt` 和新的 thread id，然后退出，交给 timer 下次运行
- 加 `--wait` 才会在当前进程内指数退避重试
- 默认 20 分钟超时
- 使用 `workspace-write` 和 `--approve-for-me`
- 不会自动重启应用服务
- 不会无限刷新整个项目
- 任务结果写入 `automation/results/`
- 日志写入 `automation/logs/`
