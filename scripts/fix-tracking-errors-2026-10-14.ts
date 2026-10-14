// 2026-10-14, round 7: 5 campaigns hit "Error: Tracking". 4 of them
// (Banner, Blarney Castle Oil, Whitley Fuel, Penn Pride) are on server 122
// / 156.235.123.x - the same IP range already flagged for the external
// port-25 block - so this looks like the same underlying network issue
// surfacing as a tracking-link failure instead. Retried all 4 via the
// platform; confirmed back to Pending.
// The 5th, 141705 (Heritage Petroleum, server 88, unrelated range), was
// retried again and moved to "Queued" (a new status, different from its
// prior Pending->Tracking-error loop) - progress, but not yet confirmed
// resolved given it has recurred before. Left as still being watched.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const FIXED_IDS = ["141732", "141729", "141719", "141713"];

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    if (FIXED_IDS.includes(c.id)) {
      patched++;
      return { ...c, status: "Pending" };
    }
    if (c.id === "141705") {
      patched++;
      return { ...c, status: "Queued" };
    }
    return c;
  });

  await db
    .update(platformSnapshot)
    .set({ campaigns: updated, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));

  console.log(`patched ${patched} campaigns`);

  await addDomainNote({
    domain: "156.235.123.44/.41/.39/.84 / 69.42.218.226",
    author: "sameer@mailclickconvert.net",
    text: `5 campaigns hit "Error: Tracking". 4 (Banner, Blarney Castle Oil, Whitley Fuel, Penn Pride) are on server 122 / 156.235.123.x - the same IP range already flagged for the external port-25 block - likely the same underlying network issue surfacing as a tracking-link failure instead of SMTP. Retried all 4 via the platform; confirmed back to Pending. 141705 (Heritage Petroleum, unrelated server 88) was retried again and moved to "Queued" - progress, but not confirmed resolved yet since it has recurred before; still being watched.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
