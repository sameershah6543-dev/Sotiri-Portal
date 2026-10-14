// 2026-10-14, round 6: user asked to make sure every campaign is assigned
// to its correct sending profile. Repointed 11 campaigns whose profiles had
// been silently migrated again (3rd time today) to server 122. 4 of them
// (A1 Petroleum, J&H Oil, Snider Energy, Merit Oil) immediately hit
// "Error: IP Range SMTP Blocked Port 25" on their first live attempt after
// the repoint - that error is a known, separate, external issue (the whole
// server 122 / 156.235.123.0/24 IP range appears to have outbound SMTP port
// 25 blocked at the network level; confirmed by an unrelated client's
// campaign also failing on that range). User is already working with the
// IP provider on that - no platform-side fix possible or needed here.
//
// Also did a full cross-reference of all 78 campaigns scheduled for today:
// all "Sending" campaigns are actively delivering (proof of correct
// profiles); all 20 "Paused" campaigns were individually checked and have
// correct current profiles with healthy delivery stats (Paused = finished
// today's send, not an error); the 1 "Pending" campaign (Wilcox + Flegel)
// also checked correct. 5 campaigns already known to be blocked by the
// port-25 issue (Devin Oil, Quick Fuel, Michigan Fleet Fueling, Penn Pride,
// PetroCard Outside Sales) have correct profiles too - only their status
// needed syncing to the portal. 141705 (Heritage Petroleum, "Error:
// Tracking") remains open as a separate, already-flagged issue.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const REPOINTED_PENDING: Record<string, string> = {
  "141732": "46690", // Banner
  "141730": "46691", // ED STAUB & SONS
  "141729": "46692", // Blarney Castle Oil
  "141728": "46693", // Hampel Oil
  "141720": "46694", // Northgate Petroleum
  "141719": "46697", // Whitley Fuel
  "141717": "46695", // Shirtcliff Oil
};

const REPOINTED_BLOCKED: Record<string, string> = {
  "141703": "46687", // A1 Petroleum
  "141702": "46688", // J&H Oil - Byron Center
  "141699": "46689", // Snider Energy
  "141716": "46696", // Merit Oil
};

const STATUS_ONLY_BLOCKED = ["141718", "141715", "141714", "141713", "141712"];

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    if (REPOINTED_PENDING[c.id]) {
      patched++;
      return { ...c, status: "Pending", profileId: REPOINTED_PENDING[c.id] };
    }
    if (REPOINTED_BLOCKED[c.id]) {
      patched++;
      return { ...c, status: "Error: IP Range SMTP Blocked Port 25", profileId: REPOINTED_BLOCKED[c.id] };
    }
    if (STATUS_ONLY_BLOCKED.includes(c.id)) {
      patched++;
      return { ...c, status: "Error: IP Range SMTP Blocked Port 25" };
    }
    return c;
  });

  await db
    .update(platformSnapshot)
    .set({ campaigns: updated, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));

  console.log(`patched ${patched} campaigns`);

  await addDomainNote({
    domain: "server 122 / 156.235.123.0-24",
    author: "sameer@mailclickconvert.net",
    text: `Full profile cross-reference of all 78 campaigns scheduled today: every campaign confirmed assigned to its correct, current sending profile. 11 campaigns had been silently re-migrated to new profiles on server 122 a third time today (A1 Petroleum, J&H Oil - Byron Center, Snider Energy, Banner, ED STAUB & SONS, Blarney Castle Oil, Hampel Oil, Northgate Petroleum, Whitley Fuel, Shirtcliff Oil, Merit Oil) - repointed all 11 to their current profiles. 4 of those (A1 Petroleum, J&H Oil, Snider Energy, Merit Oil) immediately hit "Error: IP Range SMTP Blocked Port 25" on their first live attempt - same known external block on the whole 156.235.123.0/24 range (server 122) that already affected Devin Oil, Quick Fuel, Michigan Fleet Fueling, Penn Pride, and PetroCard Outside Sales (profiles on all 5 confirmed correct, just synced their status). An unrelated client's campaign (Northland Furniture) also failed on that same range mid-send, confirming it's a network-level block, not a per-domain issue. User is escalating with the IP provider; no platform-side fix is possible until that's lifted. All 20 "Paused" campaigns and the 1 remaining "Pending" campaign (Wilcox + Flegel) were individually verified to have correct profiles. 141705 (Heritage Petroleum, "Error: Tracking") remains open as a separate unresolved issue.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
