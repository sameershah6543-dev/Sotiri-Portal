"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";

export function RenewalToggle({
  domain,
  renewMarked,
  isTeam,
}: {
  domain: string;
  renewMarked: boolean;
  isTeam: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      const res = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, field: "renewMarked", value: !renewMarked }),
      });
      if (!res.ok) {
        alert("Couldn't update — try again.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (renewMarked) {
    return (
      <div className="flex items-center gap-2">
        <StatusChip label="Marked for renewal" tone="good" />
        {isTeam && (
          <button
            type="button"
            disabled={pending}
            onClick={toggle}
            className="text-xs text-muted hover:text-ink underline decoration-dotted disabled:opacity-50"
          >
            Unmark
          </button>
        )}
      </div>
    );
  }

  if (!isTeam) {
    return <StatusChip label="Not marked" tone="warn" />;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className="rounded-md border border-warn/40 bg-warn-soft px-2 py-1 text-xs text-warn hover:border-warn transition-colors disabled:opacity-50"
    >
      Mark for renewal
    </button>
  );
}
