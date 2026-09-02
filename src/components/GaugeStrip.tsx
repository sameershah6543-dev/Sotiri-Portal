import type { GaugeCounts } from "@/types";
import { GAUGE_HELP } from "@/lib/glossary";
import { InfoTip } from "@/components/InfoTip";

function Tile({
  label,
  help,
  value,
  tone,
}: {
  label: string;
  help: string;
  value: string;
  tone?: "warn" | "critical";
}) {
  const valueClass = tone === "critical" ? "text-critical" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="flex-1 min-w-[140px] rounded-lg border border-line bg-surface px-4 py-3">
      <div className={`font-display text-2xl font-semibold ${valueClass}`}>{value}</div>
      <div className="text-xs text-muted mt-0.5 inline-flex items-center gap-1.5">
        {label}
        <InfoTip text={help} />
      </div>
    </div>
  );
}

export function GaugeStrip({ counts }: { counts: GaugeCounts }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Tile
        label="Campaigns in flight"
        help={GAUGE_HELP.campaignsInFlight}
        value={String(counts.campaignsInFlight)}
      />
      <Tile
        label="Flagged domains"
        help={GAUGE_HELP.flaggedDomains}
        value={String(counts.flaggedDomains)}
        tone={counts.flaggedDomains > 0 ? "critical" : undefined}
      />
      <Tile
        label="Expiring within 60 days"
        help={GAUGE_HELP.expiringSoon}
        value={String(counts.expiringSoon)}
        tone={counts.expiringSoon > 0 ? "warn" : undefined}
      />
      <Tile label="HTTPS coverage" help={GAUGE_HELP.httpsCoverage} value={`${counts.httpsCoveragePct}%`} />
      <Tile label="Spare profiles" help={GAUGE_HELP.spareProfiles} value={String(counts.spareProfiles)} />
    </div>
  );
}
