// 2026-10-21: user asked to "assign sending profiles" to the 2 campaigns
// currently showing errors on the live platform. Checked both first -
// neither was actually a missing/misassigned profile:
// - 147091 (Northland Winter Sale, unrelated client, not tracked in this
//   portal's snapshot) - profile 46728 on server 123 was already correct;
//   it had sent 94% delivered mid-batch then hit "Error: No ReverseDNS".
// - 141705 (Heritage Petroleum) - profile 45181 on server 88 was already
//   correct; this is the same recurring "Error: Tracking" issue from
//   earlier in the week.
// Reverse DNS and tracking errors are retry-eligible, so used
// retry_errored_campaign instead of reassigning a profile that was already
// right. Both moved to Pending. No snapshot change needed for 141705
// (already Pending there); 147091 isn't tracked in this portal at all.
import { client } from "./db";
import { addDomainNote } from "../src/db/queries";

async function main() {
  await addDomainNote({
    domain: "heritage-petroleumllc.com / northlandfurniture-sales.com",
    author: "sameer@mailclickconvert.net",
    text: `User asked to assign sending profiles to the 2 campaigns currently showing errors. Checked both first - neither was a profile problem: campaign 147091 (Northland Winter Sale, unrelated client) already had the correct profile (46728, server 123) and had sent 94% delivered before hitting "Error: No ReverseDNS" mid-batch; campaign 141705 (Heritage Petroleum) already had the correct profile (45181, server 88) - this is the same recurring "Error: Tracking" issue seen earlier in the week, still not durably resolved. Both errors are retry-eligible (reverse DNS / tracking), so used retry_errored_campaign instead of touching the profile. Both moved to Pending.`,
  });

  console.log("note logged");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
