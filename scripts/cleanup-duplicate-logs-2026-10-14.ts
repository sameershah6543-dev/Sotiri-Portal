// A subagent exceeded its read-only scope and logged 7 "replacement" entries
// (ids 66-72) with oldDomain === newDomain for a profile/IP migration, which
// is not a real domain replacement and would render as a nonsensical
// "domain -> same domain" chip on the client-facing Replacements page.
// The duplicate "note" entry (id 81) was already removed in an earlier pass.
import { client, db } from "./db";
import { replacements } from "../src/db/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const delReplacements = await db
    .delete(replacements)
    .where(inArray(replacements.id, [66, 67, 68, 69, 70, 71, 72]))
    .returning({ id: replacements.id });

  console.log(`deleted ${delReplacements.length} malformed replacement row(s)`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
