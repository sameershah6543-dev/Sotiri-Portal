// 2026-10-21 (round 2): user added 14 more IPs on server 124
// (198.20.187.211-224, ids 168030-168043) to cover the remaining domains
// flagged in the first round's note (log-server124-profiles-2026-10-21.ts).
// Created sending profiles for all 14. Combined with round 1, all 44
// campaign domains that had lost their sending profile now have one on
// server 124. Profiles only - no campaign repointing or resuming done.
import { client } from "./db";
import { addDomainNote } from "../src/db/queries";

const CREATED: { domain: string; profileId: string; ip: string }[] = [
  { domain: "santa-energytoday.com", profileId: "46816", ip: "198.20.187.224" },
  { domain: "christensenfleet-cardinc.com", profileId: "46817", ip: "198.20.187.223" },
  { domain: "internationaltruck-llc.com", profileId: "46818", ip: "198.20.187.222" },
  { domain: "jubitzcorporationn.com", profileId: "46819", ip: "198.20.187.221" },
  { domain: "rivercity-petroleumco.com", profileId: "46820", ip: "198.20.187.220" },
  { domain: "raymeroil-news.com", profileId: "46821", ip: "198.20.187.219" },
  { domain: "mccormix-oilnews.com", profileId: "46822", ip: "198.20.187.218" },
  { domain: "nickbarbieri-trucking.com", profileId: "46823", ip: "198.20.187.217" },
  { domain: "meritoilnews.com", profileId: "46824", ip: "198.20.187.216" },
  { domain: "edstaub-sonsnews.com", profileId: "46825", ip: "198.20.187.215" },
  { domain: "jb-dewarpetroleum.com", profileId: "46826", ip: "198.20.187.214" },
  { domain: "smith-bellfuel.com", profileId: "46827", ip: "198.20.187.213" },
  { domain: "jj-powellpetroleum.com", profileId: "46828", ip: "198.20.187.212" },
  { domain: "george-lowryfuel.com", profileId: "46829", ip: "198.20.187.211" },
];

async function main() {
  await addDomainNote({
    domain: "server 124 / 198.20.187.211-224",
    author: "sameer@mailclickconvert.net",
    text: `User added 14 more IPs on server 124 to cover the remaining domains flagged earlier today. Created sending profiles for all 14: ${CREATED.map((c) => `${c.domain} -> profile ${c.profileId} (${c.ip})`).join("; ")}. Combined with the first 30 created this morning, all 44 campaign domains that had lost their sending profile now have one on server 124. Still profiles only - no campaign profileId repointing or resuming has been done yet.`,
  });

  console.log("note logged");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
