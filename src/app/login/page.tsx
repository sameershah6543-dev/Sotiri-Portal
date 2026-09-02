import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

async function authenticate(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw err;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12 bg-paper">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold text-accent-strong mb-1">
          MCC Sending Manifest
        </h1>
        <p className="text-sm text-muted mb-6">Sign in to continue.</p>

        {params.error && (
          <p className="mb-4 rounded-md bg-critical-soft text-critical text-sm px-3 py-2">
            Invalid email or password.
          </p>
        )}

        <form action={authenticate} className="flex flex-col gap-3">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/"} />
          <label className="flex flex-col gap-1 text-xs text-muted">
            Email
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Password
            <input
              name="password"
              type="password"
              required
              className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-md bg-accent text-white px-3 py-2 text-sm font-medium hover:bg-accent-strong transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
