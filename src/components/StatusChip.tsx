type Tone = "good" | "warn" | "critical" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-good-soft text-good border-good/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  critical: "bg-critical-soft text-critical border-critical/30",
  neutral: "bg-surface-2 text-muted border-line",
};

export function StatusChip({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
        aria-hidden
      />
      {label}
    </span>
  );
}
