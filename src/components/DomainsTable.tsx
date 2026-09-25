"use client";

import { DataTable, type Column, type ToggleFilter } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import { DomainActions } from "@/components/DomainActions";
import { RenewalToggle } from "@/components/RenewalToggle";
import { DOMAIN_HELP, replacementTooltip } from "@/lib/glossary";
import type { ViewDomain } from "@/types";

function buildColumns(isTeam: boolean): Column<ViewDomain>[] {
  const cols: Column<ViewDomain>[] = [
    { header: "Domain", mono: true, cell: (d) => d.domain },
    { header: "Status", tooltip: DOMAIN_HELP.status, cell: (d) => d.status },
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
      header: "Renewal",
      tooltip: DOMAIN_HELP.renewal,
      cell: (d) => <RenewalToggle domain={d.domain} renewMarked={d.renewMarked} isTeam={isTeam} />,
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
              label={d.usedByCampaigns.length > 0 ? "SBL — REPLACE ASAP" : "SBL"}
              tone="critical"
              title={
                d.usedByCampaigns.length > 0
                  ? `Spamhaus Block List, and ${d.usedByCampaigns.length} campaign(s) are still sending from it — replace this domain as soon as possible.`
                  : "Spamhaus Block List — flagged, but no campaign is currently using this domain."
              }
            />
          )}
          {d.dbl && (
            <StatusChip
              label={d.usedByCampaigns.length > 0 ? "DBL — REPLACE ASAP" : "DBL"}
              tone="critical"
              title={
                d.usedByCampaigns.length > 0
                  ? `Spamhaus Domain Block List, and ${d.usedByCampaigns.length} campaign(s) are still sending from it — replace this domain as soon as possible.`
                  : "Spamhaus Domain Block List — flagged, but no campaign is currently using this domain."
              }
            />
          )}
          {d.needsRenewal && (
            <StatusChip
              label="Needs renewal"
              tone="critical"
              title="Not marked for renewal and a campaign is still using this domain — renew it before it expires."
            />
          )}
          {d.isNewDomain && (
            <StatusChip
              label={d.replacedFrom ? `Replaced ${d.replacedFrom.oldDomain}` : "Replaced"}
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
