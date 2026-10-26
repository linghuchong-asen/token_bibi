import Link from "next/link";
import { models, plans, prices, providers } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { CalculatorClient } from "@/components/CalculatorClient";

export const metadata = { title: "成本计算器" };

export default async function CalculatorPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const initialModelId = typeof params.model === "string" ? params.model : undefined;
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>成本计算器</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>成本计算器</h1>
          <p>输入每月用量，比较按量、积分和订阅的真实成本。</p>
        </div>
        <span className="badge badge-amber">按当前数据估算</span>
      </div>
      <CalculatorClient models={models} providers={providers} prices={enrichPrices(prices)} plans={plans} initialModelId={initialModelId} />
    </main>
  );
}
