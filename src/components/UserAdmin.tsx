"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminUserRow = { id: number; email: string; role: "team" | "client" };

export function UserAdmin({ users, selfEmail }: { users: AdminUserRow[]; selfEmail: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't add the user.");
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function changeRole(id: number, role: "team" | "client") {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't change the role.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(id: number) {
    const password = window.prompt("New password (min 8 characters):");
    if (!password) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't reset the password.");
        return;
      }
      alert("Password updated.");
    } finally {
      setPending(false);
    }
  }

  async function removeUser(id: number, email: string) {
    if (!window.confirm(`Remove ${email}? They will lose access immediately.`)) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't remove the user.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-critical-soft text-critical text-sm px-3 py-2">{error}</p>
      )}

      <form
        onSubmit={addUser}
        className="rounded-lg border border-line bg-surface p-4 flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1 text-xs text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Temporary password
          <input
            name="password"
            type="text"
            required
            minLength={8}
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Role
          <select
            name="role"
            defaultValue="client"
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="team">Team (edit)</option>
            <option value="client">Client (view-only)</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent text-white px-3 py-1.5 text-sm hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          Add user
        </button>
      </form>

      <div className="rounded-lg border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-xs text-muted">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2">
                  {u.email}
                  {u.email === selfEmail && <span className="text-xs text-muted"> (you)</span>}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    disabled={pending}
                    onChange={(e) => changeRole(u.id, e.target.value as "team" | "client")}
                    className="rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                  >
                    <option value="team">Team (edit)</option>
                    <option value="client">Client (view-only)</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => resetPassword(u.id)}
                      className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink hover:border-accent transition-colors disabled:opacity-50"
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeUser(u.id, u.email)}
                      className="rounded-md border border-line px-2 py-1 text-xs text-critical hover:border-critical transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
