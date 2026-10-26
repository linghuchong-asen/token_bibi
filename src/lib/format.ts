export const USD_TO_CNY = 7.2;

export function toCny(value: number, currency: "CNY" | "USD"): number {
  return currency === "USD" ? value * USD_TO_CNY : value;
}

export function formatCny(value: number, digits = 2): string {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatUsd(value: number, digits = 2): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatMoney(value: number, currency: "CNY" | "USD"): string {
  return currency === "CNY" ? formatCny(value) : formatUsd(value);
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "未提供";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
