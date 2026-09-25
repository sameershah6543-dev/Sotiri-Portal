// One-time reconciliation (2026-09-25), run after the fork-gathered
// live-campaign-details-2026-09-25.json exists:
// 1. Rebuilds platform_snapshot.campaigns from real live campaign detail
//    (id/title/status/profileId/domain/rotatedProfileId), replacing the
//    stale Sept 2 seed. Scope: every client, any status except Completed
//    (per the client's own instruction — completed campaigns don't belong
//    in this portal at all, and drop out automatically on the next refresh
//    once they complete).
// 2. Backfills domains[].usedByCampaigns / hasProfile / profileId / ip from
//    the real campaign->domain and profile->domain associations.
// 3. Domain-replacement reconciliation: for every CSV domain not found in
//    the live 186, tries to find its replacement by matching the CSV
//    domain's likely client name against an active campaign's client name
//    and that campaign's current live domain. Only inserts a replacements
//    row when a single, unambiguous match is found; anything uncertain is
//    printed for manual review rather than guessed at.
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { db, client } from "./db";
import { platformSnapshot, replacements, notes } from "../src/db/schema";
import { getCurrentSnapshotParts } from "../src/db/queries";
import { clientFromTitle } from "../src/lib/derive";
import type { PlatformCampaign, PlatformDomain, UnusedProfile } from "../src/types";

type CampaignDetail = {
  id: string;
  title: string;
  status: string;
  profileid: string | null;
  domain: string | null;
  rotatedProfileId: string | null;
};

type LiveDomain = { id: string; domain: string; status: string; expiredateiso: string; https: string; dmarcpolicy: string };
type LiveProfile = { id: string; ip: string; domain: string };

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h.trim()] = (cells[i] ?? "").trim()));
    return row;
  });
}

function normalize(s: string): string {
  return s.replace(/\.(com|net)$/, "").replace(/[-_]/g, "").toLowerCase();
}

function normalizeClientName(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function main() {
  const detailPath = join(__dirname, "live-campaign-details-2026-09-25.json");
  if (!existsSync(detailPath)) {
    throw new Error(`${detailPath} doesn't exist yet — run the campaign-detail fetch first.`);
  }
  const details: CampaignDetail[] = JSON.parse(readFileSync(detailPath, "utf8"));
  const liveDomains: LiveDomain[] = JSON.parse(
    readFileSync(join(__dirname, "live-domains-2026-09-25.json"), "utf8"),
  );
  const liveProfiles: LiveProfile[] = JSON.parse(
    readFileSync(join(__dirname, "live-profiles-2026-09-25.json"), "utf8"),
  );
  const csvRows = parseCsv(
    readFileSync(
      join(__dirname, "..", "Domains and Current Marketers Sort MCC - 2026 WIP (3).csv"),
      "utf8",
    ),
  );

  // --- 1 & 2: campaigns + domain usage/profile backfill ---
  const campaigns: PlatformCampaign[] = details
    .filter((d) => d.domain) // a campaign with no domain at all can't be shown meaningfully
    .map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status as PlatformCampaign["status"],
      profileId: d.profileid,
      domain: d.domain as string,
      rotatedProfileId: d.rotatedProfileId,
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
  console.log(
    `platform_snapshot: ${campaigns.length} active campaigns, ${domains.length} domains, ${unusedProfiles.length} unused profiles`,
  );
  void existing; // accountInfo/etc. untouched, kept for reference

  // --- 3: domain replacement reconciliation ---
  const liveDomainSet = new Set(liveDomains.map((d) => d.domain));
  const csvOnlyRows = csvRows.filter((r) => r.Domain && !liveDomainSet.has(r.Domain));

  // client name -> current live domain, from active campaigns
  const clientToLiveDomain = new Map<string, { domain: string; title: string; id: string }>();
  for (const c of campaigns) {
    const clientName = normalizeClientName(clientFromTitle(c.title));
    if (!clientToLiveDomain.has(clientName)) {
      clientToLiveDomain.set(clientName, { domain: c.domain, title: c.title, id: c.id });
    }
  }

  const liveNorm = liveDomains.map((d) => ({ raw: d.domain, norm: normalize(d.domain) }));

  const existingReplacementPairs = new Set(
    (await db.select().from(replacements)).map((r) => `${r.oldDomain}=>${r.newDomain}`),
  );

  let inserted = 0;
  const uncertain: string[] = [];

  for (const row of csvOnlyRows) {
    const oldDomain = row.Domain;
    const oldNorm = normalize(oldDomain);

    // Candidate 1: fuzzy domain-string match against the full live list.
    const fuzzyMatches = liveNorm.filter(
      (l) => l.norm.includes(oldNorm.slice(0, 8)) || oldNorm.includes(l.norm.slice(0, 8)),
    );

    // Candidate 2: does any active campaign's client name plausibly derive
    // from this old domain, and if so what live domain does it use now?
    const guessedClient = oldNorm.replace(/(news|inc|co|corp|llc|today|now|zone|fuel|fueling|petroleum|oil)$/g, "");
    let campaignMatch: { domain: string; title: string; id: string } | undefined;
    for (const [clientKey, val] of clientToLiveDomain) {
      if (clientKey.includes(guessedClient.slice(0, 6)) || guessedClient.includes(clientKey.slice(0, 6))) {
        campaignMatch = val;
        break;
      }
    }

    const candidates = new Set([...fuzzyMatches.map((m) => m.raw), ...(campaignMatch ? [campaignMatch.domain] : [])]);

    if (candidates.size === 1) {
      const newDomain = [...candidates][0];
      const pairKey = `${oldDomain}=>${newDomain}`;
      if (existingReplacementPairs.has(pairKey)) continue;

      await db.insert(replacements).values({
        oldDomain,
        newDomain,
        client: campaignMatch?.title ? clientFromTitle(campaignMatch.title) : "Unknown (auto-detected)",
        campaignTitle: campaignMatch?.title ?? "(none — domain-name match only)",
        campaignId: campaignMatch?.id ?? "",
        reason: row.NOTES || "Domain renamed/replaced (auto-detected during Sept 2026 cross-check)",
        date: "2026-09-02",
      });
      await db.insert(notes).values({
        author: "Auto cross-check (2026-09-25)",
        type: "replacement",
        target: `${oldDomain} → ${newDomain}`,
        text: "Auto-detected during CSV/live cross-check — verify this pairing is correct.",
      });
      inserted++;
    } else {
      uncertain.push(`${oldDomain} -> candidates: [${[...candidates].join(", ") || "none"}]`);
    }
  }

  console.log(`\nReplacement reconciliation: ${inserted} auto-logged, ${uncertain.length} uncertain (needs manual review).`);
  if (uncertain.length) {
    console.log("\nUncertain — review and log manually if correct:");
    for (const line of uncertain) console.log(`  - ${line}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
