// Creates the first team (edit) user so there's a way to log in and use
// /admin/users to add everyone else. Run once against the production DB.
import bcrypt from "bcryptjs";
import { db, client } from "./db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD before running this script.");
  }
  if (password.length < 8) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`${email} already has an account (role: ${existing.role}) — nothing to do.`);
    await client.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, passwordHash, role: "team" });
  console.log(`Created team user ${email}.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
