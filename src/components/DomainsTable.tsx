"use client";

import { DataTable, type Column, type ToggleFilter } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import { DomainActions } from "@/components/DomainActions";
import type { ViewDomain } from "@/types";

function buildColumns(isTeam: boolean): Column<ViewDomain>[] {
  const cols: Column<ViewDomain>[] = [
    { header: "Domain", mono: true, cell: (d) => d.domain },
    { header: "Status", cell: (d) => d.status },
    { header: "HTTPS", cell: (d) => <StatusChip label={d.https ? "On" : "Off"} tone={d.https ? "good" : "neutral"} /> },
    { header: "DMARC", mono: true, cell: (d) => d.dmarc },
    {
      header: "Expires",
      cell: (d) => (
        <div>
          <div className="font-mono text-xs">{d.expireDate}</div>
          <div
            className={`text-xs ${
              d.daysLeft < 0 ? "text-critical" : d.daysLeft <= 60 ? "text-warn" : "text-muted"
            }`}
          >
            {d.daysLeft < 0 ? `expired ${Math.abs(d.daysLeft)}d ago` : `${d.daysLeft} days left`}
          </div>
        </div>
      ),
    },
    {
      header: "Auto-renew",
      cell: (d) => <StatusChip label={d.renew} tone={d.renew === "Yes" ? "good" : "warn"} />,
    },
    {
      header: "Profile / IP",
      mono: true,
      cell: (d) =>
        d.hasProfile ? (
          <div>
            <div>{d.profileId}</div>
            <div className="text-xs text-muted">{d.ip}</div>
          </div>
        ) : (
          <StatusChip label="No profile" tone="warn" />
        ),
    },
    { header: "Used by", cell: (d) => `${d.usedByCampaigns.length} campaign(s)` },
    {
      header: "Flags",
      cell: (d) => (
        <div className="flex gap-1.5 flex-wrap">
          {d.sbl && <StatusChip label="SBL" tone="critical" />}
          {d.dbl && <StatusChip label="DBL" tone="critical" />}
          {d.isNewDomain && <StatusChip label="New" tone="neutral" />}
          {!d.sbl && !d.dbl && !d.isNewDomain && <span className="text-muted text-xs">—</span>}
        </div>
      ),
    },
  ];

  if (isTeam) {
    cols.push({
      header: "Actions",
      cell: (d) => <DomainActions domain={d.domain} sbl={d.sbl} dbl={d.dbl} />,
    });
  }

  return cols;
}

const issuesOnly: ToggleFilter<ViewDomain> = {
  label: "Issues only",
  predicate: (d) => d.sbl || d.dbl || !d.hasProfile || (d.daysLeft <= 60 && d.daysLeft >= 0) || d.daysLeft < 0,
};

export function DomainsTable({ rows, isTeam }: { rows: ViewDomain[]; isTeam: boolean }) {
  const columns = buildColumns(isTeam);
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(d) => d.domainId}
      searchText={(d) => `${d.domain} ${d.status} ${d.profileId ?? ""}`}
      toggleFilter={issuesOnly}
    />
  );
}
