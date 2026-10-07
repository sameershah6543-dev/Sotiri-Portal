"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "new_domain", label: "New domain needed" },
  { value: "remove_domain", label: "Remove a domain" },
  { value: "other", label: "Something else" },
];

export function RequestForm() {
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
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't submit the request.");
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
        + New request
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-line bg-surface p-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Type
          <select
            name="type"
            defaultValue="other"
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Subject
          <input
            name="subject"
            required
            placeholder="e.g. Add domain for new client"
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Details
        <textarea
          name="description"
          required
          rows={3}
          placeholder="Give us whatever detail would help — domain name, client, reason, etc."
          className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent resize-none"
        />
      </label>
      {error && <p className="text-sm text-critical">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent text-white px-3 py-1.5 text-sm hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          Submit
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
