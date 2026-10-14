// 2026-10-14, third round: 7 campaigns were in error.
// 6 were a repeat of the stale sending profile pattern - these domains had
// their sending profiles silently migrated overnight to a new server (122,
// new IPs 156.235.123.x) while the campaigns still pointed at the old
// profile ids on server 118, which the platform reported as
// "Error: No sending profile". Repointed each campaign's profileid +
// rotateprofiles to its new profile id, confirmed live.
// The 7th (141695, Wenatchee Petroleum) is a genuine new rDNS error on
// 67.220.75.46 - left untouched in the snapshot (still in error) pending
// the user fixing the PTR record externally.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const REPOINTED: Record<string, { profileId: string; domain: string; ip: string }> = {
  "141680": { profileId: "46669", domain: "aljohnson-distributor.com", ip: "156.235.123.55" },
  "141677": { profileId: "46670", domain: "barbieritruckingnews.com", ip: "156.235.123.54" },
  "141673": { profileId: "46671", domain: "rc-fuelgroup.com", ip: "156.235.123.52" },
  "141665": { profileId: "46672", domain: "jb-dewarpetroleum.com", ip: "156.235.123.56" },
  "141655": { profileId: "46673", domain: "smith-bellfuel.com", ip: "156.235.123.57" },
  "141650": { profileId: "46674", domain: "jj-powellpetroleum.com", ip: "156.235.123.53" },
};

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    const repoint = REPOINTED[c.id];
    if (repoint) {
      patched++;
      return { ...c, status: "Pending", profileId: repoint.profileId };
    }
    return c;
  });

  await db
    .update(platformSnapshot)
    .set({ campaigns: updated, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));

  console.log(`patched ${patched} of ${Object.keys(REPOINTED).length} campaigns`);

  await addDomainNote({
    domain: "67.220.75.x / 156.235.123.x",
    author: "sameer@mailclickconvert.net",
    text: `Round 3 of errors: 7 campaigns found in error. 6 (A L Johnson, Nick Barbieri Trucking, R C Fueling Systems, JB Dewar, Smith-Bell Petroleum, JJ Powell) had their sending profiles silently migrated to a new server (122, IPs 156.235.123.x) overnight while still pointing at the old profiles on server 118, causing "No sending profile". Repointed all 6 to their new profile ids and confirmed live (Pending). The 7th, 141695 (Wenatchee Petroleum, wenatcheepetro-news.com), is a genuine rDNS error on IP 67.220.75.46 - still in error, pending the user fixing the PTR record for that IP.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
