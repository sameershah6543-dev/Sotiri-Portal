"use client";

import { DataTable, type Column, type ToggleFilter } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import { CAMPAIGN_HELP } from "@/lib/glossary";
import { isErrorStatus } from "@/lib/derive";
import type { ViewCampaign } from "@/types";

function statusTone(status: string): "good" | "warn" | "critical" | "neutral" {
  if (isErrorStatus(status)) return "critical";
  if (status === "Pending" || status === "Sending") return "good";
  if (status === "Paused") return "warn";
  return "neutral";
}

const columns: Column<ViewCampaign>[] = [
  {
    header: "Campaign",
    cell: (c) => (
      <div>
        <div>{c.title}</div>
        <div className="text-xs text-muted">{c.client}</div>
      </div>
    ),
  },
  {
    header: "Status",
    tooltip: CAMPAIGN_HELP.status,
    cell: (c) => <StatusChip label={c.status} tone={statusTone(c.status)} />,
  },
  { header: "Domain", mono: true, tooltip: CAMPAIGN_HELP.domain, cell: (c) => c.domain },
  {
    header: "Sending profile",
    mono: true,
    tooltip: CAMPAIGN_HELP.profile,
    cell: (c) =>
      c.profileId ? (
        c.profileMismatch ? (
          <StatusChip
            label="Mismatch"
            tone="critical"
            title={`Assigned profile ${c.profileId} doesn't match what this campaign is actually sending from — check it matches "${c.client}" in the platform dashboard.`}
          />
        ) : (
          c.profileId
        )
      ) : (
        <StatusChip label="No profile" tone="critical" title="This campaign has no sending profile assigned and can't send." />
      ),
  },
  {
    header: "Flags",
    tooltip: CAMPAIGN_HELP.flags,
    cell: (c) => (
      <div className="flex gap-1.5 flex-wrap">
        {c.sbl && (
          <StatusChip
            label="SBL — REPLACE ASAP"
            tone="critical"
            title="This domain has been manually flagged as blacklisted and this campaign is still sending from it."
          />
        )}
        {c.isNewDomain && (
          <StatusChip label="New domain" tone="neutral" title="This campaign's domain was purchased/switched during a past cleanup." />
        )}
      </div>
    ),
  },
];

const issuesOnly: ToggleFilter<ViewCampaign> = {
  label: "Issues only",
  predicate: (c) => !c.profileId || c.sbl || c.profileMismatch || isErrorStatus(c.status),
};

export function CampaignsTable({ rows }: { rows: ViewCampaign[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(c) => c.id}
      searchText={(c) => `${c.title} ${c.client} ${c.domain} ${c.profileId ?? ""}`}
      toggleFilter={issuesOnly}
    />
  );
}
