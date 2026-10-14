// 2026-10-14, round 5: 11 genuine rDNS errors (server 118) found via
// get_campaigns cross-reference. User fixed the PTR records for all 11
// IPs, retried via the platform, confirmed back to Pending (domain/profile
// unchanged on all 11 - no stale-profile migration this round).
import { client, db } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { addDomainNote } from "../src/db/queries";
import type { PlatformCampaign } from "../src/types";

const FIXED_IDS = [
  "141703", "141702", "141699", "141732", "141730",
  "141729", "141728", "141720", "141719", "141717", "141716",
];

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

  console.log(`patched ${patched} of ${FIXED_IDS.length} campaigns`);

  await addDomainNote({
    domain: "67.220.75.30/.32/.36/.38/.39/.41/.43/.44/.45/.95/.99",
    author: "sameer@mailclickconvert.net",
    text: `rDNS errors cleared on 11 campaigns (A1 Petroleum, J&H Oil - Byron Center, Snider Energy, Banner, ED STAUB & SONS, Blarney Castle Oil, Hampel Oil, Northgate Petroleum, Whitley Fuel, Shirtcliff Oil, Merit Oil) - all "Error: No ReverseDNS" on server 118. Domain and sending profiles were correct, only the PTR records were missing on the IPs. Fixed at the IP/hosting level by the user, then retried via the platform's retry-errored-campaign action; confirmed all 11 back to Pending. Remaining open issue: 141705 (Heritage Petroleum) still in "Error: Tracking" - a retry alone did not resolve it (it recurred), root cause still under investigation.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
