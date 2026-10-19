// 2026-10-19: user reported changing IPs for sending profiles and asked to
// reassign all campaigns and resume everything. Checked the 6 campaigns
// still in error from the Oct 14 batch (schedule hadn't advanced in 5 days):
//
// - Banner, Penn Pride, Northland Furniture: their old server-122 sending
//   profiles had been deleted and replaced with new ones on a new server
//   (123, 84.75.245.x). Repointed all 3 via edit_campaign. BUT all 3
//   immediately hit the same "Error: IP Range SMTP Blocked Port 25" on
//   server 123 too - meaning the port-25 block is not limited to the old
//   156.235.123.x range the user already escalated; it also affects the
//   new server. Profile assignment is now correct; the block itself is
//   still unresolved.
// - Blarney Castle Oil, Whitley Fuel: their old IPs/profiles were removed
//   from the account entirely with no replacement ever created. All 30
//   IPs on server 123 are already allocated to other domains - no spare
//   IP to create a new profile for these two. Left untouched, flagged to
//   the user.
// - Heritage Petroleum: retried again (unrelated server 88 issue, not part
//   of this IP migration); moved back to Pending. Has recurred before, so
//   not declared resolved, just synced.
//
// All other "PP 06" campaigns scheduled Oct 14 that show "Paused" already
// completed a real send that day (delivered >0, healthy rates) before any
// of this IP churn - left untouched since resuming them risks duplicate
// sends to the same recipients.
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const REPOINTED_STILL_BLOCKED: Record<string, string> = {
  "141732": "46736", // Banner
  "141713": "46714", // Penn Pride
  "147091": "46728", // Northland Winter Sale (unrelated client)
};

async function main() {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const campaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];

  let patched = 0;
  const updated = campaigns.map((c) => {
    if (REPOINTED_STILL_BLOCKED[c.id]) {
      patched++;
      return { ...c, status: "Error: IP Range SMTP Blocked Port 25", profileId: REPOINTED_STILL_BLOCKED[c.id] };
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

  console.log(`patched ${patched} campaigns`);

  await addDomainNote({
    domain: "server 123 / 84.75.245.0-24",
    author: "sameer@mailclickconvert.net",
    text: `User reported changing the IPs for sending profiles and asked to reassign all campaigns and resume them. Banner, Penn Pride, and Northland Furniture had their old server-122 profiles deleted and new ones created on a new server (123, 84.75.245.x) - repointed all 3. IMPORTANT: all 3 immediately hit the same "Error: IP Range SMTP Blocked Port 25" on the new server too - the block is not limited to the old 156.235.123.x range already escalated with the IP provider; it also affects server 123. Profile assignment is correct; the underlying block is not. Blarney Castle Oil and Whitley Fuel had their old IPs/profiles removed from the account entirely with no replacement ever created, and all 30 IPs on server 123 are already allocated - no spare capacity to create new profiles for these two without provisioning more IPs. Heritage Petroleum retried again and moved to Pending (separate, unrelated server-88 issue that has recurred before - not declared resolved). All other "PP 06" Paused campaigns from Oct 14 already completed real sends with healthy delivery before this IP churn - left untouched to avoid duplicate sends.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
