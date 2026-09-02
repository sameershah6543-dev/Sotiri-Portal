import Link from "next/link";
import type { AttentionItem } from "@/types";
import { StatusChip } from "./StatusChip";

export function AttentionRail({ items }: { items: AttentionItem[] }) {
  return (
    <aside className="lg:sticky lg:top-4 lg:self-start w-full lg:w-80 shrink-0 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-display text-lg font-semibold mb-3">Needs attention</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing flagged right now.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="block rounded-md border border-line px-3 py-2 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm truncate">{item.label}</span>
                  <StatusChip
                    label={item.severity === "critical" ? "Critical" : "Warning"}
                    tone={item.severity === "critical" ? "critical" : "warn"}
                  />
                </div>
                <p className="text-xs text-muted mt-1">{item.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
