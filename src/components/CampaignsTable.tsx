"use client";

import { DataTable, type Column, type ToggleFilter } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import type { ViewCampaign } from "@/types";

const STATUS_TONE = {
  Pending: "good",
  Paused: "warn",
  Completed: "neutral",
} as const;

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
  { header: "Status", cell: (c) => <StatusChip label={c.status} tone={STATUS_TONE[c.status]} /> },
  { header: "Domain", mono: true, cell: (c) => c.domain },
  {
    header: "Profile",
    mono: true,
    cell: (c) =>
      c.profileId ? (
        c.profileMismatch ? (
          <StatusChip label={`${c.profileId} (mismatch)`} tone="critical" />
        ) : (
          c.profileId
        )
      ) : (
        <StatusChip label="No profile" tone="critical" />
      ),
  },
  { header: "HTTPS", cell: (c) => <StatusChip label={c.https ? "On" : "Off"} tone={c.https ? "good" : "neutral"} /> },
  { header: "DMARC", mono: true, cell: (c) => c.dmarc },
  {
    header: "Flags",
    cell: (c) => (
      <div className="flex gap-1.5 flex-wrap">
        {c.sbl && <StatusChip label="SBL" tone="critical" />}
        {c.isNewDomain && <StatusChip label="New domain" tone="neutral" />}
      </div>
    ),
  },
];

const issuesOnly: ToggleFilter<ViewCampaign> = {
  label: "Issues only",
  predicate: (c) => !c.profileId || c.sbl || c.profileMismatch,
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
