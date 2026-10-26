// 文件用途：全站数据类型定义（所属模块：src/data）
// 所有 data/*.json 的运行时形状都在这里声明；商业化字段（commercialRelation、
// affiliateUrl、AdProduct 等）与数据可信度字段（dataStatus、verificationMethod）
// 一并定义，保证"收入入口"与"数据可信度"在类型层就绑在一起。
export type BillingMode = "pay_as_you_go" | "subscription" | "credit" | "fixed" | "per_request";
export type ProviderType = "official_api" | "aggregator" | "relay" | "new_api_instance";
export type DataStatus = "sample" | "pending_review" | "verified";
export type VerificationMethod = "manual" | "source_check";
export type CommercialRelation = "none" | "listed" | "affiliate" | "sponsored" | "partner" | "unknown";
export type InvoiceSupport = "supported" | "unsupported" | "unknown";
export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type Model = {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  family: string;
  capabilities: string[];
  contextLength: number;
  multimodal: boolean;
  releaseDate: string;
  aliases: string[];
};

export type Provider = {
  id: string;
  slug: string;
  name: string;
  type: ProviderType;
  websiteUrl: string;
  // 推广分成链接：null 表示纯自然收录；非空时所有出站"访问官网"链接
  // 都会用它并带 rel="sponsored"，页面同时展示"含推广链接"披露声明。
  affiliateUrl: string | null;
  pricingUrl: string | null;
  monitorUrl: string | null;
  supportUrl: string | null;
  commercialRelation: CommercialRelation;
  summary: string;
  upstreamType: string;
  paymentMethods: string[];
  invoiceSupport: InvoiceSupport;
  refundPolicy: string;
  riskLabels: string[];
  dataStatus: DataStatus;
  updatedAt: string;
};

export type Price = {
  id: string;
  providerId: string;
  modelId: string;
  currency: "CNY" | "USD";
  inputPricePerMTokens: number;
  outputPricePerMTokens: number;
  cacheReadPricePerMTokens: number | null;
  billingMode: BillingMode;
  rechargeRatio: string | null;
  modelMultiplier: number | null;
  groupMultiplier: number | null;
  stabilityScore: number | null;
  sourceUrl: string;
  lastVerifiedAt: string;
  dataStatus: DataStatus;
  verificationMethod?: VerificationMethod | null;
};

export type SubscriptionPlan = {
  id: string;
  providerId: string;
  name: string;
  price: number;
  currency: "CNY" | "USD";
  period: "month" | "year" | "day" | "custom";
  quota: number | null;
  quotaUnit: "tokens" | "credits" | "requests";
  resetCycle: "none" | "daily" | "weekly" | "monthly" | "custom";
  modelScope: string[];
  overageRule: string;
  purchaseLimit: number | null;
  sourceUrl: string;
  lastVerifiedAt: string;
  dataStatus: DataStatus;
};

export type RechargeRule = {
  id: string;
  providerId: string;
  currency: "CNY" | "USD";
  rechargeRatio: string;
  minimumTopUp: number | null;
  discount: number | null;
  balanceExpiry: string | null;
  refundable: boolean | null;
  allowedModels: string[] | null;
  sourceUrl: string;
  lastVerifiedAt: string;
  dataStatus: DataStatus;
};

export type CardKeyRule = {
  id: string;
  providerId: string;
  supported: boolean;
  usageRule: string;
  validUntil: string | null;
  supportChannel: string | null;
  riskLevel: RiskLevel;
  sourceUrl: string | null;
  lastVerifiedAt: string;
  dataStatus: DataStatus;
};

export type EnrichedPrice = Price & {
  provider: Provider;
  model: Model;
  effectiveInputPrice: number;
  effectiveOutputPrice: number;
  effectiveCacheReadPrice: number;
  rechargeMultiplier: number;
};

export type SponsorPlacement = "home" | "models" | "footer";
export type SponsorTone = "blue" | "green" | "amber";

export type Sponsor = {
  id: string;
  placement: SponsorPlacement;
  title: string;
  description: string;
  sponsorName: string;
  targetUrl: string;
  label: string;
  tone: SponsorTone;
  enabled: boolean;
};

// 价格变动记录：由 scripts/price-changelog.mjs 对比基线快照与当前数据生成，
// 用于 /data-status 页面向用户证明"价格确实在实时跟踪"。
export type PriceChangeEntry = {
  priceId: string;
  providerId: string;
  modelId: string;
  changes: { field: string; from: number | string | null; to: number | string | null }[];
};

export type PriceChangeReport = {
  generatedAt: string;
  baseline: string;
  comparedFields: string[];
  changedCount: number;
  changes: PriceChangeEntry[];
};

// 广告位产品定义：/advertise 页的定价与规格说明（运营改价只动 JSON，不动代码）。
// launchPrice 为首发期价格；priceCnyPerMonth 是长期刊例价。
export type AdProduct = {
  id: string;
  placement: SponsorPlacement;
  name: string;
  position: string;
  priceCnyPerMonth: number;
  launchPriceCnyPerMonth: number;
  slots: number;
  specs: string[];
  fitFor: string;
};
