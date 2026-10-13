// Scheduled sync (2026-10-13): replaces platform_snapshot's campaigns, domains,
// and unusedProfiles with a fresh live pull from the "MCC - Sotiri" account.
// Scope matches what the client confirmed: every client, any status except
// Completed. Manual-override tables (domain_flags, replacements, requests,
// notes) are untouched — this only ever replaces the platform-sourced snapshot.
import { readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { db, client } from "./db";
import { platformSnapshot } from "../src/db/schema";
import { getCurrentSnapshotParts } from "../src/db/queries";
import type { PlatformCampaign, PlatformDomain, UnusedProfile } from "../src/types";

type LiveDomain = { id: string; domain: string; status: string; expiredateiso: string; https: string; dmarcpolicy: string };
type LiveProfile = { id: string; ip: string; domain: string };
type LiveCampaignDetail = {
  id: string;
  title: string;
  status: string;
  profileid: string | null;
  domain: string | null;
  rotatedProfileId: string | null;
};

async function main() {
  const liveDomains: LiveDomain[] = JSON.parse(
    readFileSync(join(__dirname, "live-domains-2026-10-13.json"), "utf8"),
  );
  const liveProfiles: LiveProfile[] = JSON.parse(
    readFileSync(join(__dirname, "live-profiles-2026-10-13.json"), "utf8"),
  );
  const liveCampaigns: LiveCampaignDetail[] = JSON.parse(
    readFileSync(join(__dirname, "live-campaign-details-2026-10-13.json"), "utf8"),
  );

  const campaigns: PlatformCampaign[] = liveCampaigns
    .filter((c) => c.domain) // a campaign with literally no domain can't be shown meaningfully
    .map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      profileId: c.profileid,
      domain: c.domain as string,
      rotatedProfileId: c.rotatedProfileId,
    }));

  const usedByCampaigns = new Map<string, string[]>();
  for (const c of campaigns) {
    const list = usedByCampaigns.get(c.domain) ?? [];
    list.push(c.id);
    usedByCampaigns.set(c.domain, list);
  }
  const assignedProfileIds = new Set(campaigns.map((c) => c.profileId).filter(Boolean));
  const profileByDomain = new Map(liveProfiles.map((p) => [p.domain, p]));

  const domains: PlatformDomain[] = liveDomains.map((d) => {
    const profile = profileByDomain.get(d.domain);
    return {
      domain: d.domain,
      domainId: d.id,
      status: d.status,
      https: d.https === "1",
      dmarc: d.dmarcpolicy,
      expireDate: d.expiredateiso.slice(0, 10),
      hasProfile: Boolean(profile),
      profileId: profile ? profile.id : null,
      ip: profile ? profile.ip : null,
      usedByCampaigns: usedByCampaigns.get(d.domain) ?? [],
    };
  });

  const unusedProfiles: UnusedProfile[] = liveProfiles
    .filter((p) => !assignedProfileIds.has(p.id))
    .map((p) => ({ profileId: p.id, domain: p.domain, ip: p.ip }));

  const existing = await getCurrentSnapshotParts();
  await db
    .update(platformSnapshot)
    .set({ campaigns, domains, unusedProfiles, lastRefreshed: new Date() })
    .where(eq(platformSnapshot.id, 1));
  void existing; // accountInfo kept as-is

  console.log(
    `platform_snapshot synced: ${campaigns.length} active campaigns, ${domains.length} domains, ${unusedProfiles.length} unused profiles`,
  );

  const errorCampaigns = campaigns.filter((c) => c.status.startsWith("Error"));
  console.log(`${errorCampaigns.length} campaigns with platform-flagged errors:`);
  for (const c of errorCampaigns) console.log(`  - ${c.id} ${c.title}: ${c.status} (domain: ${c.domain})`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
