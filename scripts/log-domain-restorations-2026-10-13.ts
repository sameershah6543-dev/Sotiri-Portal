// One-time log entry (2026-10-13): records the 13 domain restorations in the
// portal's Replacement log + Activity audit trail. These aren't a brand swap
// (the new domain is the same client's identity, just a re-registered
// variant of the name since the exact original string wasn't available) —
// logged as replacements anyway since that's the closest fit and keeps a
// clean audit trail of "this domain changed and why."
import { client } from "./db";
import { logReplacement } from "../src/db/queries";

const RESTORATIONS = [
  { oldDomain: "flyersenergyquick-fuel.com", newDomain: "flyers-energyquickfuel.com", client: "Flyers Energy / Quick Fuel", campaignTitle: "CFN 06 Flyers Energy", campaignId: "141577" },
  { oldDomain: "jubitz-corporation.com", newDomain: "jubitzcorporationn.com", client: "Jubitz", campaignTitle: "CFN 06 Jubitz 1", campaignId: "141600" },
  { oldDomain: "petrocardoutside-sales.com", newDomain: "petrocard-outsidesales.com", client: "PetroCard", campaignTitle: "CFN 06 PetroCard Inside Sales", campaignId: "141611" },
  { oldDomain: "international-truckllc.com", newDomain: "internationaltruck-llc.com", client: "International Truck", campaignTitle: "CFN 06 International Truck", campaignId: "141607" },
  { oldDomain: "christensen-fleetcardinc.com", newDomain: "christensenfleet-cardinc.com", client: "Christensen Fleet Card", campaignTitle: "CFN 06 Christensen Fleet Card OR", campaignId: "141594" },
  { oldDomain: "tyree-newstoday.com", newDomain: "tyreenews-today.com", client: "Tyree", campaignTitle: "CFN 06 Tyree", campaignId: "141589" },
  { oldDomain: "michigan-fleetfueling.com", newDomain: "michiganfleet-fueling.com", client: "Fleet Fueling Systems", campaignTitle: "CFN 06 Fleet Fueling Systems", campaignId: "141586" },
  { oldDomain: "hascodistributing-news.com", newDomain: "hasco-distributingnews.com", client: "HASCO Distribution", campaignTitle: "CFN 06 HASCO Distribution", campaignId: "141582" },
  { oldDomain: "carsonteam-oil.com", newDomain: "carson-teamoil.com", client: "Carson", campaignTitle: "CFN 06 Carson", campaignId: "141581" },
  { oldDomain: "wilcoxflegel-oil.com", newDomain: "wil-coxflegeloil.com", client: "Wilcox + Flegel", campaignTitle: "CFN 06 Wilcox + Flegel", campaignId: "141579" },
  { oldDomain: "worldkinectenergy-service.com", newDomain: "world-kinectenergyservice.com", client: "World Kinect Energy", campaignTitle: "CFN 06 World Kinect Energy", campaignId: "141578" },
  { oldDomain: "robinsonoil-company.com", newDomain: "robin-sonoilcompany.com", client: "Robinson Oil", campaignTitle: "CFN 06 Robinson Oil", campaignId: "141568" },
  { oldDomain: "santaenergy-today.com", newDomain: "santa-energytoday.com", client: "Santa Energy", campaignTitle: "CFN 06 Santa Energy", campaignId: "141545" },
];

async function main() {
  for (const r of RESTORATIONS) {
    await logReplacement({
      ...r,
      reason: "Original domain + sending profile were deleted from the account (cause unknown); re-registered and reconnected to restore sending.",
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
