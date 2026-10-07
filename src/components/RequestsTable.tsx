"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusChip } from "@/components/StatusChip";
import type { ClientRequest, RequestStatus } from "@/types";

const TYPE_LABEL: Record<ClientRequest["type"], string> = {
  new_domain: "New domain",
  remove_domain: "Remove domain",
  other: "Other",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_TONE: Record<RequestStatus, "warn" | "good" | "neutral"> = {
  open: "warn",
  in_progress: "neutral",
  done: "good",
};

function StatusControl({ id, status, isTeam }: { id: number; status: RequestStatus; isTeam: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!isTeam) return <StatusChip label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />;

  async function change(next: RequestStatus) {
    setPending(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        alert("Couldn't update status — try again.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => change(e.target.value as RequestStatus)}
      className="rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
    >
      {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function buildColumns(isTeam: boolean): Column<ClientRequest>[] {
  return [
    {
      header: "Subject",
      cell: (r) => (
        <div>
          <div>{r.subject}</div>
          <div className="text-xs text-muted">{TYPE_LABEL[r.type]}</div>
        </div>
      ),
    },
    { header: "Details", cell: (r) => <span className="line-clamp-2 max-w-md">{r.description}</span> },
    { header: "Requested by", mono: true, cell: (r) => r.requestedBy },
    { header: "Filed", mono: true, cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      header: "Status",
      tooltip: "Open = just filed. In progress = someone's on it. Done = handled.",
      cell: (r) => <StatusControl id={r.id} status={r.status} isTeam={isTeam} />,
    },
  ];
}

export function RequestsTable({ rows, isTeam }: { rows: ClientRequest[]; isTeam: boolean }) {
  const columns = buildColumns(isTeam);
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      searchText={(r) => `${r.subject} ${r.description} ${r.requestedBy} ${TYPE_LABEL[r.type]}`}
    />
  );
}
