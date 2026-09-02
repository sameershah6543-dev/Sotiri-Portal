"use client";

import { DataTable, type Column, type ToggleFilter } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import { DomainActions } from "@/components/DomainActions";
import { DOMAIN_HELP, replacementTooltip } from "@/lib/glossary";
import type { ViewDomain } from "@/types";

function buildColumns(isTeam: boolean): Column<ViewDomain>[] {
  const cols: Column<ViewDomain>[] = [
    { header: "Domain", mono: true, cell: (d) => d.domain },
    { header: "Status", tooltip: DOMAIN_HELP.status, cell: (d) => d.status },
    { header: "DMARC", mono: true, tooltip: DOMAIN_HELP.dmarc, cell: (d) => d.dmarc },
    {
      header: "Expires",
      tooltip: DOMAIN_HELP.expires,
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
      tooltip: DOMAIN_HELP.autoRenew,
      cell: (d) => <StatusChip label={d.renew} tone={d.renew === "Yes" ? "good" : "warn"} />,
    },
    {
      header: "Profile / IP",
      mono: true,
      tooltip: DOMAIN_HELP.profileIp,
      cell: (d) =>
        d.hasProfile ? (
          <div>
            <div>{d.profileId}</div>
            <div className="text-xs text-muted">{d.ip}</div>
          </div>
        ) : (
          <StatusChip label="No profile" tone="warn" title="No sending profile is assigned to this domain." />
        ),
    },
    { header: "Used by", tooltip: DOMAIN_HELP.usedBy, cell: (d) => `${d.usedByCampaigns.length} campaign(s)` },
    {
      header: "Flags",
      tooltip: DOMAIN_HELP.flags,
      cell: (d) => (
        <div className="flex gap-1.5 flex-wrap">
          {d.sbl && (
            <StatusChip
              label="SBL"
              tone="critical"
              title="Spamhaus Block List — manually flagged as a spam source. Consider replacing this domain."
            />
          )}
          {d.dbl && (
            <StatusChip
              label="DBL"
              tone="critical"
              title="Spamhaus Domain Block List — manually flagged for hosting bad content. Consider replacing this domain."
            />
          )}
          {d.needsRenewal && (
            <StatusChip
              label="Needs renewal"
              tone="critical"
              title="Auto-renew is off and a campaign is still using this domain — renew it manually before it expires."
            />
          )}
          {d.isNewDomain && (
            <StatusChip
              label="Replaced"
              tone="neutral"
              title={d.replacedFrom ? replacementTooltip(d.replacedFrom) : "This domain replaced an older one."}
            />
          )}
          {!d.sbl && !d.dbl && !d.needsRenewal && !d.isNewDomain && <span className="text-muted text-xs">—</span>}
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
  predicate: (d) => d.sbl || d.dbl || d.needsRenewal || !d.hasProfile || d.daysLeft < 0,
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
