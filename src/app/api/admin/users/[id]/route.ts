import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole, guardErrorResponse } from "@/lib/auth-guards";
import { countUsersByRole, deleteUser, getUserById, setUserPassword, updateUserRole } from "@/db/queries";

async function guardLastTeamUser(id: number, nextRole: "team" | "client" | null) {
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isRemovingTeamAccess = target.role === "team" && nextRole !== "team";
  if (isRemovingTeamAccess) {
    const teamCount = await countUsersByRole("team");
    if (teamCount <= 1) {
      return NextResponse.json(
        { error: "Can't remove the last team (edit) account — add another team user first." },
        { status: 400 },
      );
    }
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("team");
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();

    if (body.role === "team" || body.role === "client") {
      const blocked = await guardLastTeamUser(id, body.role);
      if (blocked) return blocked;
      await updateUserRole(id, body.role);
    }

    if (typeof body.password === "string" && body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(body.password, 12);
      await setUserPassword(id, passwordHash);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return guardErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("team");
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const blocked = await guardLastTeamUser(id, null);
    if (blocked) return blocked;

    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return guardErrorResponse(err);
  }
}
