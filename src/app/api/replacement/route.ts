import { NextRequest, NextResponse } from "next/server";
import { requireRole, guardErrorResponse } from "@/lib/auth-guards";
import { logReplacement } from "@/db/queries";

const REQUIRED = ["newDomain", "oldDomain", "client", "campaignTitle", "campaignId", "reason", "date"] as const;

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("team");
    const body = await req.json();

    for (const field of REQUIRED) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    await logReplacement({
      newDomain: body.newDomain.trim(),
      oldDomain: body.oldDomain.trim(),
      client: body.client.trim(),
      campaignTitle: body.campaignTitle.trim(),
      campaignId: body.campaignId.trim(),
      reason: body.reason.trim(),
      date: body.date.trim(),
      author: user.email ?? "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return guardErrorResponse(err);
  }
}
