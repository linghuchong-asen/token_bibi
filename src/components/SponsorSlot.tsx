import type { Sponsor } from "@/data/types";

const toneClasses = {
  blue: "sponsor-blue",
  green: "sponsor-green",
  amber: "sponsor-amber",
};

export function SponsorSlot({ sponsor, compact = false }: { sponsor?: Sponsor; compact?: boolean }) {
  if (!sponsor) return null;
  return (
    <aside className={`sponsor-slot ${toneClasses[sponsor.tone]} ${compact ? "sponsor-compact" : ""}`} aria-label={`${sponsor.label}：${sponsor.title}`}>
      <div className="sponsor-meta">
        <span className="sponsor-label">{sponsor.label}</span>
        <span className="sponsor-name">{sponsor.sponsorName}</span>
      </div>
      <div className="sponsor-body">
        <div>
          <strong>{sponsor.title}</strong>
          <p>{sponsor.description}</p>
        </div>
        <a href={sponsor.targetUrl} className="button button-small">了解详情</a>
      </div>
    </aside>
  );
}
