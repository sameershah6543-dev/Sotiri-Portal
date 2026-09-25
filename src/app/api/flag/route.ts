import { NextRequest, NextResponse } from "next/server";
import { requireRole, guardErrorResponse } from "@/lib/auth-guards";
import { addDomainNote, setDomainFlag, setRenewalMarked } from "@/db/queries";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("team");
    const body = await req.json();
    const domain = typeof body.domain === "string" ? body.domain.trim() : "";
    if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });

    if (body.field === "sbl" || body.field === "dbl") {
      if (typeof body.value !== "boolean") {
        return NextResponse.json({ error: "value must be boolean" }, { status: 400 });
      }
      await setDomainFlag({
        domain,
        field: body.field,
        value: body.value,
        author: user.email ?? "unknown",
        note: typeof body.note === "string" ? body.note : undefined,
      });
    } else if (body.field === "renewMarked") {
      if (typeof body.value !== "boolean") {
        return NextResponse.json({ error: "value must be boolean" }, { status: 400 });
      }
      await setRenewalMarked({
        domain,
        value: body.value,
        author: user.email ?? "unknown",
        note: typeof body.note === "string" ? body.note : undefined,
      });
    } else if (typeof body.note === "string" && body.note.trim()) {
      await addDomainNote({ domain, author: user.email ?? "unknown", text: body.note.trim() });
    } else {
      return NextResponse.json({ error: "Nothing to do" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return guardErrorResponse(err);
  }
}
