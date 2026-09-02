import type { ViewDomain } from "@/types";

export function ExpiringDomainsPanel({ domains }: { domains: ViewDomain[] }) {
  const expiring = domains
    .filter((d) => d.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="flex-1 rounded-lg border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-semibold mb-1">Expiring within 30 days</h2>
      <p className="text-xs text-muted mb-3">Domain registrations to renew soon, soonest first.</p>
      {expiring.length === 0 ? (
        <p className="text-sm text-muted">Nothing expiring in the next 30 days.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {expiring.map((d) => (
            <li key={d.domainId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-mono truncate">{d.domain}</span>
              <span className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs text-muted">{d.expireDate}</span>
                <span className={`text-xs font-medium ${d.daysLeft < 0 ? "text-critical" : "text-warn"}`}>
                  {d.daysLeft < 0 ? `expired ${Math.abs(d.daysLeft)}d ago` : `${d.daysLeft}d left`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
