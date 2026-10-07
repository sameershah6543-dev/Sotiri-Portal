import { NextRequest, NextResponse } from "next/server";
import { requireRole, guardErrorResponse } from "@/lib/auth-guards";
import { updateRequestStatus } from "@/db/queries";
import type { RequestStatus } from "@/types";

const VALID_STATUSES: RequestStatus[] = ["open", "in_progress", "done"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("team");
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await updateRequestStatus({ id, status: body.status, author: user.email ?? "unknown" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return guardErrorResponse(err);
  }
}
