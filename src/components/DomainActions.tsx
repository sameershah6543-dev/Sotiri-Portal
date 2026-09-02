"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DomainActions({
  domain,
  sbl,
  dbl,
}: {
  domain: string;
  sbl: boolean;
  dbl: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(field: "sbl" | "dbl", value: boolean) {
    setPending(true);
    try {
      const res = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, field, value }),
      });
      if (!res.ok) {
        alert("Couldn't update the flag — try again.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function addNote() {
    const text = window.prompt(`Add a note for ${domain}:`);
    if (!text || !text.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, note: text.trim() }),
      });
      if (!res.ok) {
        alert("Couldn't save the note — try again.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => toggle("sbl", !sbl)}
        className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
          sbl
            ? "border-critical bg-critical-soft text-critical"
            : "border-line text-muted hover:text-ink hover:border-accent"
        }`}
      >
        {sbl ? "Clear SBL" : "Flag SBL"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => toggle("dbl", !dbl)}
        className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
          dbl
            ? "border-critical bg-critical-soft text-critical"
            : "border-line text-muted hover:text-ink hover:border-accent"
        }`}
      >
        {dbl ? "Clear DBL" : "Flag DBL"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={addNote}
        className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink hover:border-accent transition-colors disabled:opacity-50"
      >
        + Note
      </button>
    </div>
  );
}
