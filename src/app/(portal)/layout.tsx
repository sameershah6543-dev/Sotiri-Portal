import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

// Every portal page renders the DB snapshot merged with live session/role state
// at request time (brief §5) — never attempt to statically prerender any of it.
export const dynamic = "force-dynamic";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/domains", label: "Domains" },
  { href: "/replacements", label: "Replacements" },
  { href: "/activity", label: "Activity" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4 flex-wrap">
          <h1 className="font-display text-xl font-semibold text-accent-strong">
            MCC Sending Manifest
          </h1>
          <nav className="flex items-center gap-1 flex-wrap">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-ink hover:bg-surface-2 transition-colors"
              >
                {tab.label}
              </Link>
            ))}
            {role === "team" && (
              <Link
                href="/admin/users"
                className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-ink hover:bg-surface-2 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted">
              {session?.user?.email} · {role === "team" ? "Team (edit)" : "Client (view-only)"}
            </span>
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:text-ink hover:border-accent transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
