import { client, db } from "./db";
import { notes } from "../src/db/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const delNotes = await db
    .delete(notes)
    .where(inArray(notes.id, [82, 83, 84, 85, 86, 87, 88, 89]))
    .returning({ id: notes.id });
  console.log(`deleted ${delNotes.length} note row(s)`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
