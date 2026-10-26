import type { BillingMode, EnrichedPrice, ProviderType } from "@/data/types";

export type PriceSort = "effective-input" | "effective-output" | "stability" | "name";

export type PriceFilters = {
  query: string;
  billing: "all" | BillingMode;
  providerType: "all" | ProviderType;
  dataStatus?: "all" | "verified";
};

export function filterPrices(rows: EnrichedPrice[], filters: PriceFilters): EnrichedPrice[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (q) {
      const haystack = [row.model.name, row.model.vendor, row.provider.name, ...row.model.aliases]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.billing !== "all" && row.billingMode !== filters.billing) return false;
    if (filters.providerType !== "all" && row.provider.type !== filters.providerType) return false;
    if (filters.dataStatus === "verified" && row.dataStatus !== "verified") return false;
    return true;
  });
}

export function sortPrices(rows: EnrichedPrice[], sort: PriceSort): EnrichedPrice[] {
  return [...rows].sort((a, b) => {
    if (sort === "name") return a.model.name.localeCompare(b.model.name, "zh-CN");
    if (sort === "stability") return (b.stabilityScore ?? 0) - (a.stabilityScore ?? 0);
    if (sort === "effective-output") return a.effectiveOutputPrice - b.effectiveOutputPrice;
    return a.effectiveInputPrice - b.effectiveInputPrice;
  });
}

export function queryPrices(rows: EnrichedPrice[], filters: PriceFilters, sort: PriceSort): EnrichedPrice[] {
  return sortPrices(filterPrices(rows, filters), sort);
}
