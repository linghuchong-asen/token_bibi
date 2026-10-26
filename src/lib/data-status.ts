import type { DataStatus, VerificationMethod } from "@/data/types";

type StatusRecord = { dataStatus: DataStatus; verificationMethod?: VerificationMethod | null };

export function summarizeDataStatus(records: StatusRecord[]): DataStatus {
  if (records.length === 0) return "sample";
  if (records.every((record) => record.dataStatus === "verified")) return "verified";
  if (records.some((record) => record.dataStatus === "verified" || record.dataStatus === "pending_review")) return "pending_review";
  return "sample";
}

export function commonVerificationMethod(records: StatusRecord[]): VerificationMethod | null {
  if (records.length === 0 || !records.every((record) => record.dataStatus === "verified")) return null;
  const methods = new Set(records.map((record) => record.verificationMethod ?? null));
  if (methods.size !== 1) return null;
  return [...methods][0];
}

export function priceStatusNote(records: StatusRecord[]): string {
  const status = summarizeDataStatus(records);
  const verified = records.filter((record) => record.dataStatus === "verified").length;
  if (status === "verified") return `全部 ${records.length} 条价格已核验，来源与更新时间见表格。`;
  if (status === "pending_review") return `已核验 ${verified} / ${records.length} 条价格；其余价格待核验或仍为样例。`;
  return "价格仍为样例数据，请以平台公开页面为准。";
}
