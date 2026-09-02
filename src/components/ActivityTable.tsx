"use client";

import { DataTable, type Column } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import type { Note } from "@/types";

const TYPE_LABEL: Record<Note["type"], string> = {
  "sbl-on": "SBL flagged",
  "sbl-off": "SBL cleared",
  "dbl-on": "DBL flagged",
  "dbl-off": "DBL cleared",
  note: "Note",
  replacement: "Replacement",
};

const TYPE_TONE: Record<Note["type"], "critical" | "good" | "neutral"> = {
  "sbl-on": "critical",
  "dbl-on": "critical",
  "sbl-off": "good",
  "dbl-off": "good",
  note: "neutral",
  replacement: "neutral",
};

const columns: Column<Note>[] = [
  { header: "When", mono: true, cell: (n) => new Date(n.ts).toLocaleString() },
  { header: "Type", cell: (n) => <StatusChip label={TYPE_LABEL[n.type]} tone={TYPE_TONE[n.type]} /> },
  { header: "Target", mono: true, cell: (n) => n.target },
  { header: "Note", cell: (n) => n.text },
  { header: "Author", cell: (n) => n.author },
];

export function ActivityTable({ rows }: { rows: Note[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(n) => n.id}
      searchText={(n) => `${n.target} ${n.text} ${n.author} ${TYPE_LABEL[n.type]}`}
    />
  );
}
