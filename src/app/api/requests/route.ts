import { NextRequest, NextResponse } from "next/server";
import { requireAuth, guardErrorResponse } from "@/lib/auth-guards";
import { createRequest } from "@/db/queries";
import { sendRequestTeamsNotification } from "@/lib/teams";
import type { RequestType } from "@/types";

const VALID_TYPES: RequestType[] = ["new_domain", "remove_domain", "other"];

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const type: RequestType = VALID_TYPES.includes(body.type) ? body.type : "other";

    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "description is required" }, { status: 400 });

    const requestedBy = user.email ?? "unknown";
    await createRequest({ type, subject, description, requestedBy });

    // Best-effort — a Teams webhook hiccup shouldn't fail the request itself.
    try {
      await sendRequestTeamsNotification({ subject, type, description, requestedBy });
    } catch (err) {
      console.error("[requests] Teams notification failed", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return guardErrorResponse(err);
  }
}
