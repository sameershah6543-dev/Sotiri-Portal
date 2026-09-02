import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/types";

export class GuardError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Every write API route calls this itself — the UI hides write controls from
// the client role, but that must never be the only enforcement (brief §2/§5).
export async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user) throw new GuardError(401, "Not authenticated");
  if (session.user.role !== role) throw new GuardError(403, "Forbidden");
  return session.user;
}

export function guardErrorResponse(err: unknown) {
  if (err instanceof GuardError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}
