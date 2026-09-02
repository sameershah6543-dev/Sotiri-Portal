"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FIELDS: Array<{ name: string; label: string; placeholder?: string }> = [
  { name: "client", label: "Client", placeholder: "Gaubert Oil" },
  { name: "campaignTitle", label: "Campaign title", placeholder: "CFN 05 Gaubert Oil" },
  { name: "campaignId", label: "Campaign ID", placeholder: "140905" },
  { name: "oldDomain", label: "Old domain", placeholder: "old-domain.com" },
  { name: "newDomain", label: "New domain", placeholder: "new-domain.com" },
  { name: "reason", label: "Reason", placeholder: "missing - never existed in account" },
];

export function ReplacementForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't save the replacement.");
        return;
      }
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-md bg-accent text-white px-3 py-1.5 text-sm hover:bg-accent-strong transition-colors"
      >
        + Log replacement
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-line bg-surface p-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.name} className="flex flex-col gap-1 text-xs text-muted">
            {f.label}
            <input
              name={f.name}
              required
              placeholder={f.placeholder}
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-xs text-muted">
          Date
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
      </div>
      {error && <p className="text-sm text-critical">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent text-white px-3 py-1.5 text-sm hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
