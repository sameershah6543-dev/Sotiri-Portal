"use client";

import { DataTable, type Column } from "@/components/DataTable";
import type { Replacement } from "@/types";

const columns: Column<Replacement>[] = [
  { header: "Date", mono: true, cell: (r) => r.date },
  { header: "Client", cell: (r) => r.client },
  { header: "Campaign", cell: (r) => `${r.campaignTitle} (${r.campaignId})` },
  { header: "Old domain", mono: true, cell: (r) => r.oldDomain },
  { header: "New domain", mono: true, cell: (r) => r.newDomain },
  { header: "Reason", cell: (r) => r.reason },
];

export function ReplacementsTable({ rows }: { rows: Replacement[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      searchText={(r) => `${r.client} ${r.campaignTitle} ${r.oldDomain} ${r.newDomain} ${r.reason}`}
    />
  );
}
