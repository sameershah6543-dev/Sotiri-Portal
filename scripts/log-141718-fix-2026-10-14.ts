import { client } from "./db";
import { addDomainNote } from "../src/db/queries";

async function main() {
  await addDomainNote({
    domain: "67.220.75.x / 156.235.123.x",
    author: "sameer@mailclickconvert.net",
    text: `Addendum to the round-2 fix: a 13th campaign, 141718 (PP 06 Devin Oil, devin-petroleum.com), had the same stale profile reference as 141624 but hadn't attempted a send yet, so it still showed plain "Pending" and wasn't caught by status alone. Found via a full profile/domain cross-reference against live data, repointed to the correct new profile (46667) and confirmed live. Account-wide: 0 campaigns in error status, 0 mismatches on cross-reference of all active campaigns.`,
  });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
