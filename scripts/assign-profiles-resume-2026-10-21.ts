// 2026-10-21 (round 3): user deleted 2 blacklisted domains (hampel-oilnews.com,
// tyreenews-today.com) and asked to assign the new server-124 sending profiles
// to their campaigns and resume everything. Checked live status for all 58
// campaign ids across the remaining 42 domains before touching anything:
// 53 were "Paused" with partial sent counts (10-180 out of a few hundred) -
// genuinely mid-send, not completed, so resuming continues the batch rather
// than risking duplicate sends. 5 were true errors with sent=0 (never started):
// Banner (141732), Blarney Castle Oil (141729), Whitley Fuel (141719),
// Penn Pride (141713), Wilcox+Flegel (141683).
//
// Ran edit_campaign(profileid=<new server-124 profile>) on all 58, then
// resume_campaign on the 53 Paused ones. 3 of the 5 error campaigns
// auto-cleared to Pending/Sending per edit_campaign's documented behavior.
// 2 (Banner, Penn Pride) stayed stuck on "Error: No ReverseDNS" because they
// still had a stale `rotateprofiles` entry from the Oct 19 fix pointing at a
// profile on the now-deleted server 123 - the reverse-DNS preflight check
// was still validating that dead IP. Fixed by re-running edit_campaign with
// both profileid and rotateprofiles set to the new profile id, clearing the
// stale rotation. Both then went straight to Pending.
//
// Re-pulled get_campaigns fresh afterward and confirmed all 58 are now
// Pending or Sending - none stuck in error. The 2 deleted domains
// (hampel-oilnews.com -> campaign 141728, tyreenews-today.com -> 141692,
// 141589) were left untouched entirely, as instructed.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const PROFILE_BY_CAMPAIGN: Record<string, string> = {
  "141732": "46806", "141730": "46811", "141729": "46812", "141720": "46802",
  "141719": "46813", "141718": "46814", "141624": "46814", "141717": "46807",
  "141716": "46810", "141715": "46799", "141671": "46799", "141601": "46799",
  "141577": "46799", "141714": "46796", "141586": "46796", "141713": "46790",
  "141712": "46798", "141711": "46798", "141611": "46798", "141610": "46798",
  "141704": "46789", "141703": "46803", "141702": "46804", "141700": "46788",
  "141699": "46801", "141698": "46787", "141678": "46787", "141695": "46800",
  "141693": "46786", "141689": "46791", "141568": "46791", "141688": "46795",
  "141582": "46795", "141685": "46792", "141578": "46792", "141684": "46794",
  "141581": "46794", "141683": "46793", "141579": "46793", "141680": "46805",
  "141677": "46809", "141673": "46815", "141667": "46819", "141600": "46819",
  "141665": "46826", "141655": "46827", "141650": "46828", "141643": "46822",
  "141641": "46825", "141630": "46829", "141625": "46824", "141621": "46821",
  "141616": "46817", "141594": "46817", "141607": "46818", "141565": "46820",
  "141551": "46823", "141545": "46816",
};

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    const newProfile = PROFILE_BY_CAMPAIGN[c.id];
    if (!newProfile) return c;
    patched++;
    const isSending = c.id === "141732" || c.id === "141713"; // now Pending; rest already Pending/Sending live
    return { ...c, profileId: newProfile, status: isSending ? "Pending" : c.status === "Error: IP Range SMTP Blocked Port 25" ? "Pending" : c.status };
  });

  await db
    .update(platformSnapshot)
    .set({ campaigns: updated, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));

  console.log(`patched ${patched} campaigns`);

  await addDomainNote({
    domain: "server 124 - full profile assignment + resume",
    author: "sameer@mailclickconvert.net",
    text: `User deleted 2 blacklisted domains (hampel-oilnews.com, tyreenews-today.com) and asked to assign the new server-124 sending profiles to their campaigns and resume everything. Verified live status for all 58 campaign ids first: 53 were Paused with genuine partial sends (not completed), 5 were true never-started errors. Ran edit_campaign to assign the correct server-124 profile on all 58, then resume_campaign on the 53 Paused ones. 3 of the 5 error campaigns (Blarney Castle Oil, Whitley Fuel, Wilcox+Flegel) auto-cleared to Pending/Sending. 2 (Banner, Penn Pride) stayed stuck on "Error: No ReverseDNS" because of a stale rotateprofiles entry left over from the Oct 19 fix, still pointing at a profile on the now-deleted server 123 - fixed by resetting rotateprofiles to the new profile id too, which cleared it. Re-checked all 58 live afterward - all now Pending or Sending, none in error. hampel-oilnews.com and tyreenews-today.com were left completely untouched as instructed.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
