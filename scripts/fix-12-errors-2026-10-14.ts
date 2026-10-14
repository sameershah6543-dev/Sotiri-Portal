// 2026-10-14, second round: 12 campaigns were in error.
// Group A (6) - rDNS/server-ping errors, user fixed PTR/server at the IP
// level, retried live, confirmed back to Pending. Domain/profile unchanged.
// Group B (6) - the 6 fixed yesterday for rDNS had their domains silently
// migrated to brand-new sending profiles this morning (new server 122, new
// IPs 156.235.123.x) while the campaigns still pointed at the old profile
// ids on the old server (118) - which the platform then reported as
// "Error: No sending profile". Repointed each campaign's profileid +
// rotateprofiles to its new profile id, confirmed live.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const GROUP_A_FIXED_IDS = ["141680", "141677", "141673", "141665", "141655", "141650"];

const GROUP_B_REPOINTED: Record<string, { profileId: string; domain: string; ip: string }> = {
  "141643": { profileId: "46662", domain: "mccormix-oilnews.com", ip: "156.235.123.63" },
  "141641": { profileId: "46663", domain: "edstaub-sonsnews.com", ip: "156.235.123.59" },
  "141630": { profileId: "46664", domain: "george-lowryfuel.com", ip: "156.235.123.61" },
  "141625": { profileId: "46666", domain: "meritoilnews.com", ip: "156.235.123.60" },
  "141624": { profileId: "46667", domain: "devin-petroleum.com", ip: "156.235.123.58" },
  "141621": { profileId: "46668", domain: "raymeroil-news.com", ip: "156.235.123.62" },
};

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    if (GROUP_A_FIXED_IDS.includes(c.id)) {
      patched++;
      return { ...c, status: "Pending" };
    }
    const repoint = GROUP_B_REPOINTED[c.id];
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

  console.log(`patched ${patched} of ${GROUP_A_FIXED_IDS.length + Object.keys(GROUP_B_REPOINTED).length} campaigns`);

  await addDomainNote({
    domain: "67.220.75.x / 156.235.123.x",
    author: "sameer@mailclickconvert.net",
    text: `Round 2 of errors cleared (12 total). Group A (6): A L Johnson, Nick Barbieri Trucking, R C Fueling Systems, JB Dewar, Smith-Bell Petroleum, JJ Powell - were rDNS/server-ping errors, user fixed PTR/server at the IP level, retried and confirmed Pending. Group B (6): MCCORMIX, ED STAUB & SONS, LOWRY (GEORGE W), Merit Oil, Devin Oil, Raymer Oil - yesterday's rDNS fix domains had been silently migrated to new sending profiles on a new server (122, IPs 156.235.123.x) overnight; campaigns still pointed at the old profiles on server 118, causing "No sending profile". Repointed all 6 to their new profile ids and confirmed live. Account-wide: 0 campaigns in error status.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
