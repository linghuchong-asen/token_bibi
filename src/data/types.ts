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
