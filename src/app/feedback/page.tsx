import Link from "next/link";
import { models, providers } from "@/data";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata = { title: "数据纠错" };

export default function FeedbackPage() {
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>数据纠错</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>数据纠错</h1>
          <p>价格、计费规则、风险信息和来源都可以反馈。</p>
        </div>
      </div>
      <FeedbackForm models={models} providers={providers} />
      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>处理说明</h2>
        <div className="stack muted small">
          <div>1. 先核对来源链接和截图。</div>
          <div>2. 再更新对应平台、模型或价格记录。</div>
          <div>3. 重要修正会在页面上更新核验时间。</div>
          <div>4. 当前反馈保存在 ECS 本地文件，后续迁移到数据库。</div>
        </div>
      </section>
    </main>
  );
}
