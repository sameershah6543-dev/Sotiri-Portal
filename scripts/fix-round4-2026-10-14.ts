// 2026-10-14, round 4: 5 campaigns found in error after round 3's fix.
// 141695 (Wenatchee Petroleum) had been cleared of its rDNS error, then got
// hit by the same stale-profile migration landmine (new profile 46684 on
// server 122, 156.235.123.51) before it could actually send - repointed.
// 141705 (Heritage Petroleum) hit "Error: Tracking" (statusint 712) - zone
// file and domain status looked healthy, so retried via the platform's
// retry-errored-campaign action (built to handle tracking-domain errors);
// confirmed back to Pending.
// 141703 (A1 Petroleum), 141702 (J&H Oil - Byron Center), 141699
// (Snider Energy) are genuine new "No ReverseDNS" errors on server 118 -
// left in error pending the user fixing the PTR records.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    if (c.id === "141695") {
      patched++;
      return { ...c, status: "Pending", profileId: "46684" };
    }
    if (c.id === "141705") {
      patched++;
      return { ...c, status: "Pending" };
    }
    return c;
  });

  await db
    .update(platformSnapshot)
    .set({ campaigns: updated, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));

  console.log(`patched ${patched} campaign(s)`);

  await addDomainNote({
    domain: "156.235.123.51 / 69.42.218.226",
    author: "sameer@mailclickconvert.net",
    text: `Round 4: 5 campaigns found in error. 141695 (Wenatchee Petroleum) was hit by the same stale-profile migration landmine right after its rDNS fix (new profile 46684, server 122, 156.235.123.51) - repointed and confirmed Pending. 141705 (Heritage Petroleum) hit "Error: Tracking" - domain/zone file looked healthy, retried via the platform and confirmed back to Pending. 3 remain in error pending PTR fixes: 141703 A1 Petroleum (67.220.75.43), 141702 J&H Oil - Byron Center (67.220.75.41), 141699 Snider Energy (67.220.75.45) - all genuine "No ReverseDNS" on server 118.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
