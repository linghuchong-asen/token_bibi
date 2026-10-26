# AGENTS.md — 本机 AI 协作规则

这台 ECS 是 **2 核 8 G**，同一时刻只能跑一个重任务。遵守下面几条，能避免超时误判、
无效重试和随之而来的 token 浪费。

## 1. 重任务串行

构建、全量测试、e2e、lighthouse 互斥执行；不要同时开两个 dev server。
两个项目并行时：A 项目在跑构建，B 项目只做读代码、改代码、看日志这类轻活。

## 2. 预计超过 30 秒的命令，一律后台跑

```bash
./scripts/ai-bg.sh run build -- pnpm build
./scripts/ai-bg.sh status build        # 打印日志尾部 + 退出码
./scripts/ai-bg.sh wait build 120      # 最多阻塞 120 秒，超时会告诉你"还在跑"
./scripts/ai-bg.sh kill build
```

前台阻塞等待是工具超时的主要来源。后台跑 + `status` 轮询可以从根上绕开它，
日志落在 `.ai-logs/<name>.log`，退出码落在同目录 `.exit` 文件。

## 3. 测试已经串行化

`pnpm test` 已内置 `--no-file-parallelism`，`vitest.config.ts` 里也锁了
`fileParallelism: false` / `maxWorkers: 1`。不要为了"快"去加 `--parallel`、`--threads`。

## 4. 探活用 wait-http.sh，不用短超时 curl

```bash
./scripts/wait-http.sh http://127.0.0.1:8090 60
```

首次编译、首屏 SSR 在 2 核上可能要几十秒。`curl --max-time 5` 会把"还没编译完"
误判成"服务挂了"，然后 agent 去改端口、改配置——这是最贵的错误。

## 5. 验证页面用生产产物

```bash
./scripts/ai-bg.sh run preview -- ./scripts/preview-prod.sh 8099
./scripts/wait-http.sh http://127.0.0.1:8099 120
```

它在 `/tmp` 的独立目录里 build + start，**不碰 :8090 上的线上实例**。
只有做热更新调试时才用 `pnpm dev`。

## 6. 内存

`tsc` / `next build` 前加 `NODE_OPTIONS=--max-old-space-size=3072`（8 G 机器，别给 4096）。

## 7. 失败先归因，别急着改代码

- `exit 124` = 超时；`exit 137` = OOM 被杀；`TIMEOUT` / `still running` = 还没跑完。
  这类失败**不是**代码 bug，正确动作是重跑或延长等待。
- 只有日志里出现明确的错误栈、断言失败、类型错误，才动代码。

## 8. 端口约定

| 端口 | 用途 |
|---|---|
| 8090 | 线上预览，systemd 托管（`token-bibi-app.service`） |
| 8099 | 生产产物验证（`preview-prod.sh`） |
| 5173 | ai-diagram 前端 vite dev |
| 3001 | ai-diagram 后端 nest |

## 9. 功能变更必须形成文档

所有涉及功能点的新增、修改、删除，必须同步形成文档，不允许只改代码不留痕：

- 在 `docs/specs/` 下按既有格式（`spec.md` / `tasks.md` / `checklist.md`）建立或更新
  对应规格文档；改动说明写入
  `docs/specs/align-yutu-doc-and-code/code-iteration-changelog.md`。
- 涉及部署、接口、数据库结构的变更，同步更新 `docs/deployment/`、`docs/tech/` 下相关文档。
- 功能下线/删除同样要留档，注明删除原因与影响范围。

## 10. 代码必须写中文注释，文件头部必须加注释

- 所有编写或修改的代码，注释一律使用中文。
- 每个文件必须在文件头部加注释，说明该文件的用途、所属模块；修改文件时应同步更新
  头部注释，使其与实际内容一致。
- 关键逻辑（算法、降级策略、校验规则、支付/鉴权等）需用中文注释说明"为什么这么做"，
  而不只是复述代码。
