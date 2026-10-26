// 文件用途：价格走势组件（所属模块：src/components，服务端组件）
// 用内联 SVG 折线呈现单条价格在快照序列里的变化，零客户端 JS。
// 输入/输出两条线各自按自身最小-最大归一化（两条线量级差数倍，
// 共用刻度会把输入价压成直线）；百分比涨跌与首末值必须以文字并列展示，
// 图形只做辅助，不能让用户从图上猜数字。
import type { PriceSeries } from "@/lib/price-history";

const WIDTH = 240;
const HEIGHT = 56;

// 把数值序列映射为 SVG 折线的点串；全部等值时画一条中线
function toPolyline(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * (WIDTH - 8) + 4;
      const y = span === 0 ? HEIGHT / 2 : HEIGHT - 6 - ((value - min) / span) * (HEIGHT - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function percentText(first: number, last: number): string {
  if (first === 0) return "—";
  const pct = ((last - first) / first) * 100;
  if (Math.abs(pct) < 0.05) return "持平";
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export function PriceTrend({ series, providerName }: { series: PriceSeries; providerName: string }) {
  const first = series.points[0];
  const last = series.points[series.points.length - 1];
  const inputValues = series.points.map((point) => point.trend.in);
  const outputValues = series.points.map((point) => point.trend.out);
  const capturedRange = `${first.capturedAt.slice(0, 10)} → ${last.capturedAt.slice(0, 10)}`;

  return (
    <div className="metric">
      <div className="badge-row" style={{ justifyContent: "space-between" }}>
        <strong>{providerName}</strong>
        <span className="small muted">{series.points.length} 个快照点 · {capturedRange}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: 56, marginTop: 8 }} role="img" aria-label={`${providerName} 价格走势折线图`}>
        <polyline points={toPolyline(inputValues)} fill="none" stroke="#2563eb" strokeWidth="2" />
        <polyline points={toPolyline(outputValues)} fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 3" />
      </svg>
      <div className="small" style={{ marginTop: 6 }}>
        <span style={{ color: "#2563eb" }}>■</span> 输入 {first.trend.in} → {last.trend.in}（{percentText(first.trend.in, last.trend.in)}）
        <span style={{ color: "#7c3aed", marginLeft: 10 }}>■</span> 输出 {first.trend.out} → {last.trend.out}（{percentText(first.trend.out, last.trend.out)}）
      </div>
    </div>
  );
}
