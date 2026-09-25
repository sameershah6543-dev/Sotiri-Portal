// One-time reconciliation (2026-09-25): replaces the stale 2026-09-02 seed
// domain roster with real, live data pulled from the MCC platform via MCP
// (live-domains-2026-09-25.json / live-profiles-2026-09-25.json), and merges
// in the team's own manual renewal-tracking CSV for the renewMarked flag.
//
// Deliberately leaves campaigns/unusedProfiles/accountInfo untouched — doing
// those properly needs ~100 getcampaigndetail calls to resolve which
// campaign uses which domain, gated on confirming which client-code
// prefixes belong to this portal (see chat). Once MCC_API_KEY is live,
// /api/refresh handles all of this correctly and automatically going forward.
import { readFileSync } from "fs";
import { join } from "path";
import { db, client } from "./db";
import { domainFlags, platformSnapshot } from "../src/db/schema";
import { getCurrentSnapshotParts } from "../src/db/queries";
import type { PlatformDomain } from "../src/types";

type LiveDomain = {
  id: string;
  domain: string;
  status: string;
  expiredateiso: string;
  https: string;
  dmarcpolicy: string;
};

type LiveProfile = {
  id: string;
  ip: string;
  domain: string;
};

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

async function main() {
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

  const profileByDomain = new Map(liveProfiles.map((p) => [p.domain, p]));
  const csvByDomain = new Map(csvRows.filter((r) => r.Domain).map((r) => [r.Domain, r]));

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
      // Not recomputed in this pass — see file header. Left empty rather than
      // carrying over stale associations from campaign titles that may have
      // since changed (some clearly have — e.g. raymer-oil.com -> raymeroil-news.com).
      usedByCampaigns: [],
    };
  });

  const existing = await getCurrentSnapshotParts();

  await db
    .insert(platformSnapshot)
    .values({
      id: 1,
      campaigns: existing.campaigns,
      domains,
      unusedProfiles: existing.unusedProfiles,
      accountInfo: existing.accountInfo ?? {
        billingPeriod: "August 28, 2026 - September 28, 2026, 12:00 am",
        packageSize: 400000,
        sentThisCycle: 8701,
        totalIps: 154,
        complaints: 0,
      },
      lastRefreshed: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSnapshot.id,
      set: { domains, lastRefreshed: new Date() },
    });
  console.log(`platform_snapshot.domains replaced with ${domains.length} live domains`);

  let renewUpdates = 0;
  for (const d of domains) {
    const csvRow = csvByDomain.get(d.domain);
    if (!csvRow) continue;
    const renewMarked = csvRow.Renew.toLowerCase() === "yes";
    const note = csvRow.NOTES || null;
    await db
      .insert(domainFlags)
      .values({ domain: d.domain, renewMarked, originalNote: note, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: domainFlags.domain,
        set: { renewMarked, originalNote: note, updatedAt: new Date() },
      });
    renewUpdates++;
  }
  console.log(`domain_flags: renewMarked/notes set from CSV for ${renewUpdates} domains`);

  const csvOnlyRows = csvRows.filter((r) => r.Domain && !liveDomains.some((d) => d.domain === r.Domain));
  if (csvOnlyRows.length > 0) {
    console.log(
      `\n${csvOnlyRows.length} domains are in the CSV but NOT in the live MCC account (likely still pending creation or broken):`,
    );
    for (const r of csvOnlyRows) console.log(`  - ${r.Domain}${r.NOTES ? ` (${r.NOTES})` : ""}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
