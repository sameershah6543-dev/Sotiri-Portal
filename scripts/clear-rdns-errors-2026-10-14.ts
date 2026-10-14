// 2026-10-14: 6 campaigns were stuck with "Error: No ReverseDNS" (PTR records
// missing on their IPs). The user fixed the rDNS/PTR records at the IP/hosting
// level (domain + sending profile were never wrong), then had these retried
// via retry_errored_campaign, which the platform confirmed moved all 6 back to
// "Pending". This patches just their status in the snapshot (no domain/profile
// change, so this isn't a replacement) and logs an activity note.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const FIXED_IDS = ["141643", "141641", "141630", "141625", "141624", "141621"];

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    if (FIXED_IDS.includes(c.id)) {
      patched++;
      return { ...c, status: "Pending" };
    }
    return c;
  });

  await db
    .update(platformSnapshot)
    .set({ campaigns: updated, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));

  console.log(`patched ${patched} of ${FIXED_IDS.length} campaigns to Pending`);

  await addDomainNote({
    domain: "67.220.75.29/.31/.35/.37/.92/.94",
    author: "sameer@mailclickconvert.net",
    text: `rDNS errors cleared on 6 campaigns (MCCORMIX CORPORATION, ED STAUB & SONS, LOWRY (GEORGE W), Merit Oil, Devin Oil, Raymer Oil) — was "Error: No ReverseDNS". Domain and sending profile were correct, only the PTR record was missing on the IP. Fixed at the IP/hosting level, then retried via the platform's retry-errored-campaign action; confirmed all 6 back to Pending.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
