// 文件用途：OpenRouter 收录目录扩容工具（所属模块：数据采集与核验管线 scripts/）
// 做两件事：
//   1) 把精选清单里的 OpenRouter 模型合并进 data/models.json（已存在的不动）
//   2) 同步合并 data/imports/openrouter-map.json（本站模型 id → OpenRouter 模型 id）
// 映射文件不进版本库，因此在 ECS 等新环境部署后需重跑本脚本重建映射，
// 之后每日管线（collect → import → verify-sources）即可覆盖全部收录模型。
// 所有模型条目的元数据（上下文长度、多模态能力、发布日期）都取自 OpenRouter
// 实时 API，本地只做筛选与中文能力标签映射，不手写数字——保证真实性。
// 幂等：重复执行只会补缺失项，不覆盖已有人工修正。
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

// 精选清单：只收录主流厂商的旗舰/主力型号，放弃 :batch 变体与实验分支。
// or=OpenRouter 模型 id；slug=本站 id（点号转连字符，与既有命名一致）；
// name=展示名；vendor/family 与 data/models.json 既有口径对齐。
const CATALOG = [
  // OpenAI
  { or: "openai/gpt-5.5", slug: "gpt-5-5", name: "GPT-5.5", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-5.4", slug: "gpt-5-4", name: "GPT-5.4", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-5.4-mini", slug: "gpt-5-4-mini", name: "GPT-5.4 Mini", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-5.2", slug: "gpt-5-2", name: "GPT-5.2", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-5.1", slug: "gpt-5-1", name: "GPT-5.1", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-5", slug: "gpt-5", name: "GPT-5", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-4.1", slug: "gpt-4-1", name: "GPT-4.1", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-4o", slug: "gpt-4o", name: "GPT-4o", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-4o-mini", slug: "gpt-4o-mini", name: "GPT-4o Mini", vendor: "OpenAI", family: "gpt" },
  { or: "openai/o3", slug: "o3", name: "o3", vendor: "OpenAI", family: "gpt" },
  { or: "openai/o4-mini", slug: "o4-mini", name: "o4-mini", vendor: "OpenAI", family: "gpt" },
  { or: "openai/gpt-oss-120b", slug: "gpt-oss-120b", name: "gpt-oss-120b", vendor: "OpenAI", family: "gpt" },
  // Anthropic
  { or: "anthropic/claude-opus-5.5", slug: "claude-opus-5-5", name: "Claude Opus 5.5", vendor: "Anthropic", family: "claude" },
  { or: "anthropic/claude-sonnet-5.5", slug: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", vendor: "Anthropic", family: "claude" },
  { or: "anthropic/claude-haiku-5.5", slug: "claude-haiku-5-5", name: "Claude Haiku 5.5", vendor: "Anthropic", family: "claude" },
  { or: "anthropic/claude-opus-4.5", slug: "claude-opus-4-5", name: "Claude Opus 4.5", vendor: "Anthropic", family: "claude" },
  { or: "anthropic/claude-sonnet-4.5", slug: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", vendor: "Anthropic", family: "claude" },
  { or: "anthropic/claude-haiku-4.5", slug: "claude-haiku-4-5", name: "Claude Haiku 4.5", vendor: "Anthropic", family: "claude" },
  // Google
  { or: "google/gemini-3.5-flash", slug: "gemini-3-5-flash", name: "Gemini 3.5 Flash", vendor: "Google", family: "gemini" },
  { or: "google/gemini-3.1-pro-preview", slug: "gemini-3-1-pro-preview", name: "Gemini 3.1 Pro Preview", vendor: "Google", family: "gemini" },
  { or: "google/gemini-2.5-pro", slug: "gemini-2-5-pro", name: "Gemini 2.5 Pro", vendor: "Google", family: "gemini" },
  { or: "google/gemini-2.5-flash", slug: "gemini-2-5-flash", name: "Gemini 2.5 Flash", vendor: "Google", family: "gemini" },
  // DeepSeek
  { or: "deepseek/deepseek-v4-pro-0813", slug: "deepseek-v4-pro-0813", name: "DeepSeek V4 Pro 0813", vendor: "DeepSeek", family: "deepseek" },
  { or: "deepseek/deepseek-v4-flash-0731", slug: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash 0731", vendor: "DeepSeek", family: "deepseek" },
  { or: "deepseek/deepseek-v3.2", slug: "deepseek-v3-2", name: "DeepSeek V3.2", vendor: "DeepSeek", family: "deepseek" },
  { or: "deepseek/deepseek-r1-0528", slug: "deepseek-r1-0528", name: "DeepSeek R1 0528", vendor: "DeepSeek", family: "deepseek" },
  // 阿里通义千问
  { or: "qwen/qwen3.7-max", slug: "qwen3-7-max", name: "Qwen3.7-Max", vendor: "Alibaba", family: "qwen" },
  { or: "qwen/qwen3.6-plus", slug: "qwen3-6-plus", name: "Qwen3.6-Plus", vendor: "Alibaba", family: "qwen" },
  { or: "qwen/qwen3.5-plus-20260420", slug: "qwen3-5-plus-20260420", name: "Qwen3.5-Plus 0420", vendor: "Alibaba", family: "qwen" },
  { or: "qwen/qwen3-coder", slug: "qwen3-coder", name: "Qwen3 Coder", vendor: "Alibaba", family: "qwen" },
  { or: "qwen/qwen3.8-max-prime", slug: "qwen3-8-max-prime", name: "Qwen3.8-Max Prime", vendor: "Alibaba", family: "qwen" },
  // 月之暗面
  { or: "moonshotai/kimi-k3.1-pro", slug: "kimi-k3-1-pro", name: "Kimi K3.1 Pro", vendor: "Moonshot", family: "kimi" },
  { or: "moonshotai/kimi-k2.6", slug: "kimi-k2-6", name: "Kimi K2.6", vendor: "Moonshot", family: "kimi" },
  { or: "moonshotai/kimi-k2-thinking", slug: "kimi-k2-thinking", name: "Kimi K2 Thinking", vendor: "Moonshot", family: "kimi" },
  // 智谱
  { or: "z-ai/glm-5.3", slug: "glm-5-3", name: "GLM-5.3", vendor: "Zhipu AI", family: "glm" },
  { or: "z-ai/glm-5.2", slug: "glm-5-2", name: "GLM-5.2", vendor: "Zhipu AI", family: "glm" },
  { or: "z-ai/glm-5", slug: "glm-5", name: "GLM-5", vendor: "Zhipu AI", family: "glm" },
  { or: "z-ai/glm-4.7", slug: "glm-4-7", name: "GLM-4.7", vendor: "Zhipu AI", family: "glm" },
  // MiniMax
  { or: "minimax/minimax-m3.1-flash", slug: "minimax-m3-1-flash", name: "MiniMax M3.1 Flash", vendor: "MiniMax", family: "minimax" },
  { or: "minimax/minimax-m2.7", slug: "minimax-m2-7", name: "MiniMax M2.7", vendor: "MiniMax", family: "minimax" },
  // xAI
  { or: "x-ai/grok-4.20", slug: "grok-4-20", name: "Grok 4.20", vendor: "xAI", family: "grok", extraCaps: ["搜索"] },
  { or: "x-ai/grok-4.6", slug: "grok-4-6", name: "Grok 4.6", vendor: "xAI", family: "grok", extraCaps: ["搜索"] },
  { or: "x-ai/grok-4.3", slug: "grok-4-3", name: "Grok 4.3", vendor: "xAI", family: "grok", extraCaps: ["搜索"] },
  // Meta
  { or: "meta-llama/llama-4-maverick", slug: "llama-4-maverick", name: "Llama 4 Maverick", vendor: "Meta", family: "llama" },
  { or: "meta-llama/llama-4-scout", slug: "llama-4-scout", name: "Llama 4 Scout", vendor: "Meta", family: "llama" },
  // Mistral
  { or: "mistralai/mistral-large-4-0", slug: "mistral-large-4-0", name: "Mistral Large 4", vendor: "Mistral AI", family: "mistral" },
  { or: "mistralai/mistral-medium-3-5", slug: "mistral-medium-3-5", name: "Mistral Medium 3.5", vendor: "Mistral AI", family: "mistral" },
  // Amazon
  { or: "amazon/nova-pro-v1", slug: "nova-pro-v1", name: "Nova Pro 1.0", vendor: "Amazon", family: "nova" },
];

// 中文能力标签的固定输出顺序，与既有 models.json 条目保持一致
const CAP_ORDER = ["识图", "深度思考", "编码", "长文本", "多模态", "搜索"];
// 上下文 ≥160k 记为"长文本"：覆盖 200k 档（o3/Claude），不把 128k 档（GPT-4o）算进去
const LONG_CONTEXT_THRESHOLD = 160_000;

function deriveCapabilities(source, extraCaps = []) {
  const modalities = source?.architecture?.input_modalities ?? [];
  const supported = source?.supported_parameters ?? [];
  const caps = new Set(extraCaps);
  if (modalities.includes("image")) caps.add("识图");
  if (supported.includes("reasoning")) caps.add("深度思考");
  caps.add("编码");
  if (Number(source?.context_length) >= LONG_CONTEXT_THRESHOLD) caps.add("长文本");
  if (modalities.includes("audio") || modalities.includes("video")) caps.add("多模态");
  // 按固定顺序输出，保证与既有条目观感一致
  return CAP_ORDER.filter((cap) => caps.has(cap));
}

async function main() {
  console.log("拉取 OpenRouter 实时模型列表…");
  const response = await fetch("https://openrouter.ai/api/v1/models");
  if (!response.ok) throw new Error(`OpenRouter API HTTP ${response.status}`);
  const payload = await response.json();
  const byId = new Map(payload.data.map((model) => [model.id, model]));

  const modelsPath = path.join(root, "data", "models.json");
  const models = JSON.parse(await readFile(modelsPath, "utf8"));
  const existingIds = new Set(models.map((model) => model.id));

  const mapPath = path.join(root, "data", "imports", "openrouter-map.json");
  let map = {};
  try {
    map = JSON.parse(await readFile(mapPath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    console.warn("warn: 映射文件不存在，将全量重建");
  }

  let addedModels = 0;
  for (const item of CATALOG) {
    const source = byId.get(item.or);
    if (!source) throw new Error(`精选清单里的模型在实时 API 中不存在（可能已下架，需人工确认）: ${item.or}`);

    // 映射无条件合并：保证每个精选模型都能被每日管线采集与复核
    if (map[item.slug] !== item.or) {
      map[item.slug] = item.or;
    }

    if (existingIds.has(item.slug)) continue;
    const modalities = source?.architecture?.input_modalities ?? [];
    const createdDate = source.created
      ? new Date(source.created * 1000).toISOString().slice(0, 10)
      : null;
    models.push({
      id: item.slug,
      slug: item.slug,
      name: item.name,
      vendor: item.vendor,
      family: item.family,
      capabilities: deriveCapabilities(source, item.extraCaps),
      contextLength: Number(source.context_length) || null,
      multimodal: modalities.some((m) => m !== "text" && m !== "file"),
      releaseDate: createdDate,
      aliases: [item.or.split("/")[1]],
    });
    addedModels += 1;
  }

  // 保持既有排序风格：按加入顺序追加即可（页面有自己的排序逻辑）
  await writeFile(modelsPath, `${JSON.stringify(models, null, 2)}\n`, "utf8");
  await writeFile(mapPath, `${JSON.stringify(map, null, 2)}\n`, "utf8");
  console.log(`目录扩容完成：新增模型 ${addedModels} 个，模型总数 ${models.length}，映射总数 ${Object.keys(map).length}`);
}

main().catch((error) => {
  console.error("扩容失败:", error.message);
  process.exit(1);
});
