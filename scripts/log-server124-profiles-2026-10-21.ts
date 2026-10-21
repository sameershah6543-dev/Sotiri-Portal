// 2026-10-21: user added 30 new IPs on a new server (124, 198.20.187.225-254)
// and asked to create sending profiles ONLY for now, for domains used in
// campaigns. Note: server 123 (84.75.245.x) and its profiles from the Oct 19
// round are completely gone from get_sending_profiles now - the account only
// has 101 profiles left (servers 88, 102, 103, 106), none on 122/123/124
// before this. So nearly every domain in the stuck Oct 14 recurring batch
// had lost its profile entirely, not just the port-25-blocked ones.
//
// 44 campaign domains were found with no current sending profile at all.
// Only 30 new IPs exist, so prioritized: the 10 actively "Error: IP Range
// SMTP Blocked Port 25" domains first, then the next 20 by highest campaign
// id (the most current/active end of the stuck batch). Created all 30 via
// add_sending_profile, pairing each with one of the 30 new server-124 IPs.
//
// Did NOT repoint any campaign's profileId or touch campaign status - user
// said "only for now", so this just records the new profiles exist and
// flags the remaining 14 domains that still have no profile and no IP left
// to create one, pending more capacity or a priority call from the user.
import { client } from "./db";
import { addDomainNote } from "../src/db/queries";

const CREATED: { domain: string; profileId: string; ip: string }[] = [
  { domain: "dassels-petroleumnews.com", profileId: "46786", ip: "198.20.187.254" },
  { domain: "western-statesnews.com", profileId: "46787", ip: "198.20.187.253" },
  { domain: "hasco-distributionnews.com", profileId: "46788", ip: "198.20.187.252" },
  { domain: "yeagersfuel-inc.com", profileId: "46789", ip: "198.20.187.251" },
  { domain: "pennpride-inc.com", profileId: "46790", ip: "198.20.187.250" },
  { domain: "robin-sonoilcompany.com", profileId: "46791", ip: "198.20.187.249" },
  { domain: "world-kinectenergyservice.com", profileId: "46792", ip: "198.20.187.248" },
  { domain: "wil-coxflegeloil.com", profileId: "46793", ip: "198.20.187.247" },
  { domain: "carson-teamoil.com", profileId: "46794", ip: "198.20.187.246" },
  { domain: "hasco-distributingnews.com", profileId: "46795", ip: "198.20.187.245" },
  { domain: "michiganfleet-fueling.com", profileId: "46796", ip: "198.20.187.244" },
  { domain: "tyreenews-today.com", profileId: "46797", ip: "198.20.187.243" },
  { domain: "petrocard-outsidesales.com", profileId: "46798", ip: "198.20.187.242" },
  { domain: "flyers-energyquickfuel.com", profileId: "46799", ip: "198.20.187.241" },
  { domain: "wenatcheepetro-news.com", profileId: "46800", ip: "198.20.187.240" },
  { domain: "snider-energynews.com", profileId: "46801", ip: "198.20.187.239" },
  { domain: "northgate-petroleumco.com", profileId: "46802", ip: "198.20.187.238" },
  { domain: "a1petroleum-news.com", profileId: "46803", ip: "198.20.187.237" },
  { domain: "jandhoil-news.com", profileId: "46804", ip: "198.20.187.236" },
  { domain: "aljohnson-distributor.com", profileId: "46805", ip: "198.20.187.235" },
  { domain: "bannerfuel-news.com", profileId: "46806", ip: "198.20.187.234" },
  { domain: "shirtcliff-oilco.com", profileId: "46807", ip: "198.20.187.233" },
  { domain: "hampel-oilnews.com", profileId: "46808", ip: "198.20.187.232" },
  { domain: "barbieritruckingnews.com", profileId: "46809", ip: "198.20.187.231" },
  { domain: "merit-oilco.com", profileId: "46810", ip: "198.20.187.230" },
  { domain: "edstaubfuel-news.com", profileId: "46811", ip: "198.20.187.229" },
  { domain: "blarney-castleoilnews.com", profileId: "46812", ip: "198.20.187.228" },
  { domain: "whitley-petroleum.com", profileId: "46813", ip: "198.20.187.227" },
  { domain: "devin-petroleum.com", profileId: "46814", ip: "198.20.187.226" },
  { domain: "rc-fuelgroup.com", profileId: "46815", ip: "198.20.187.225" },
];

const STILL_NEEDS_PROFILE = [
  "jubitzcorporationn.com",
  "jb-dewarpetroleum.com",
  "smith-bellfuel.com",
  "jj-powellpetroleum.com",
  "mccormix-oilnews.com",
  "edstaub-sonsnews.com",
  "george-lowryfuel.com",
  "meritoilnews.com",
  "raymeroil-news.com",
  "christensenfleet-cardinc.com",
  "internationaltruck-llc.com",
  "rivercity-petroleumco.com",
  "nickbarbieri-trucking.com",
  "santa-energytoday.com",
];

async function main() {
  await addDomainNote({
    domain: "server 124 / 198.20.187.225-254",
    author: "sameer@mailclickconvert.net",
    text: `User added 30 new IPs on a new server (124, 198.20.187.225-254) and asked to create sending profiles only for now, for domains used in campaigns. Found that server 123's profiles from the Oct 19 round are gone entirely - the account had only 101 sending profiles left (servers 88, 102, 103, 106), none on 122/123/124. 44 campaign domains had no profile at all as a result. With only 30 new IPs, prioritized the 10 actively "Error: IP Range SMTP Blocked Port 25" domains plus the next 20 highest-campaign-id Pending domains from the stuck Oct 14 batch, and created all 30 new sending profiles pairing them with the server-124 IPs: ${CREATED.map((c) => `${c.domain} -> profile ${c.profileId} (${c.ip})`).join("; ")}. Campaign profileId/status were NOT changed - profiles only, as requested. Still need profiles and have no spare IP: ${STILL_NEEDS_PROFILE.join(", ")} - needs either more IPs provisioned on server 124 or a priority call on which of these to bump ahead of the 30 just created.`,
  });

  console.log("note logged");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
