import type { GaugeCounts } from "@/types";

function Tile({ label, value, tone }: { label: string; value: string; tone?: "warn" | "critical" }) {
  const valueClass = tone === "critical" ? "text-critical" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="flex-1 min-w-[140px] rounded-lg border border-line bg-surface px-4 py-3">
      <div className={`font-display text-2xl font-semibold ${valueClass}`}>{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

export function GaugeStrip({ counts }: { counts: GaugeCounts }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Tile label="Campaigns in flight" value={String(counts.campaignsInFlight)} />
      <Tile
        label="Flagged domains"
        value={String(counts.flaggedDomains)}
        tone={counts.flaggedDomains > 0 ? "critical" : undefined}
      />
      <Tile
        label="Expiring within 60 days"
        value={String(counts.expiringSoon)}
        tone={counts.expiringSoon > 0 ? "warn" : undefined}
      />
      <Tile label="HTTPS coverage" value={`${counts.httpsCoveragePct}%`} />
      <Tile label="Spare profiles" value={String(counts.spareProfiles)} />
    </div>
  );
}
