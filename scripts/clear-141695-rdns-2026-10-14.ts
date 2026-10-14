// 2026-10-14: 141695 (Wenatchee Petroleum, wenatcheepetro-news.com) was the
// 7th error in round 3 - a genuine "Error: No ReverseDNS" on 67.220.75.46.
// User fixed the PTR record, retried via the platform, confirmed Pending.
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
    domain: "67.220.75.46",
    author: "sameer@mailclickconvert.net",
    text: `rDNS error cleared on 141695 (PP 06 Wenatchee Petroleum, wenatcheepetro-news.com) - was "Error: No ReverseDNS". Domain and sending profile were correct, only the PTR record was missing on the IP. Fixed at the IP/hosting level, then retried via the platform's retry-errored-campaign action; confirmed back to Pending. Account-wide: 0 campaigns in error status.`,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
