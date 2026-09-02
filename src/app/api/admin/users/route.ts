import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole, guardErrorResponse } from "@/lib/auth-guards";
import { createUser, findUserByEmail, listUsers } from "@/db/queries";

export async function GET() {
  try {
    await requireRole("team");
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return guardErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("team");
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "client" ? "client" : "team";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: "That email already has an account" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, passwordHash, role });
    return NextResponse.json({ user });
  } catch (err) {
    return guardErrorResponse(err);
  }
}
