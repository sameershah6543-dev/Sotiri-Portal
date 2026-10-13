// Second batch (2026-10-13): logs the 5 more domain restorations found by
// cross-referencing every active campaign's domain against the live domain
// list, not just the platform's own "Error: ..." status flags — these 6
// campaigns (5 distinct domains) hadn't been flagged as broken yet since
// they're scheduled further out, but were just as dead as this morning's 13.
import { client } from "./db";
import { logReplacement } from "../src/db/queries";

const RESTORATIONS = [
  { oldDomain: "penn-prideinc.com", newDomain: "pennpride-inc.com", client: "Penn Pride", campaignTitle: "PP 06 Penn Pride", campaignId: "141713" },
  { oldDomain: "yeagers-fuelinc.com", newDomain: "yeagersfuel-inc.com", client: "Yeagers Fuel", campaignTitle: "PP 06 YEAGERS FUEL", campaignId: "141704" },
  { oldDomain: "hascodistribution-news.com", newDomain: "hasco-distributionnews.com", client: "HASCO Distribution 2", campaignTitle: "PP 06 HASCO Distribution 2", campaignId: "141700" },
  { oldDomain: "westernstates-news.com", newDomain: "western-statesnews.com", client: "Western States Oil", campaignTitle: "PP 06 Western States Oil", campaignId: "141678" },
  { oldDomain: "dasselspetroleum-news.com", newDomain: "dassels-petroleumnews.com", client: "Dassel's Petroleum", campaignTitle: "PP 06 Dassel's Petroleum", campaignId: "141693" },
];

async function main() {
  for (const r of RESTORATIONS) {
    await logReplacement({
      ...r,
      reason: "Original domain + sending profile were deleted from the account (cause unknown); re-registered and reconnected to restore sending. Found via comprehensive cross-reference, not yet flagged by the platform's own error status.",
      date: "2026-10-13",
      author: "sameer@mailclickconvert.net",
    });
    console.log(`logged: ${r.oldDomain} -> ${r.newDomain} (${r.client})`);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
