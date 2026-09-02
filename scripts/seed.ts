// Loads the brief's Appendix A snapshot (pulled from the platform on 2026-09-02,
// scripts/seed-data.json) into the DB so the app has real data from the first deploy.
// Safe to re-run: it replaces the seed rows rather than duplicating them.
import { db, client } from "./db";
import { domainFlags, notes, platformSnapshot, replacements } from "../src/db/schema";
import seed from "./seed-data.json";

// Prose figures from the brief §3 ("Known current data") — not present in the
// Appendix A JSON blob itself. Refreshed for real once /api/refresh runs live.
const ACCOUNT_INFO = {
  billingPeriodStart: "2026-08-28",
  billingPeriodEnd: "2026-09-28",
  packageSize: 400000,
  sentThisCycle: 5378,
  totalIps: 154,
  complaints: 0,
};

async function main() {
  const campaigns = seed.campaigns.map(({ sbl: _sbl, isNewDomain: _isNewDomain, ...c }) => c);
  const domains = seed.domains.map(
    ({ sbl: _sbl, dbl: _dbl, originalNote: _originalNote, daysLeft: _daysLeft, ...d }) => d,
  );

  await db
    .insert(platformSnapshot)
    .values({
      id: 1,
      campaigns,
      domains,
      unusedProfiles: seed.unusedProfiles,
      accountInfo: ACCOUNT_INFO,
      lastRefreshed: new Date(seed.lastRefreshed),
    })
    .onConflictDoUpdate({
      target: platformSnapshot.id,
      set: {
        campaigns,
        domains,
        unusedProfiles: seed.unusedProfiles,
        accountInfo: ACCOUNT_INFO,
        lastRefreshed: new Date(seed.lastRefreshed),
      },
    });
  console.log(`platform_snapshot: ${campaigns.length} campaigns, ${domains.length} domains`);

  await db.delete(domainFlags);
  const flagRows = seed.domains
    .filter((d) => d.sbl || d.dbl || d.originalNote)
    .map((d) => ({ domain: d.domain, sbl: d.sbl, dbl: d.dbl, originalNote: d.originalNote }));
  if (flagRows.length) await db.insert(domainFlags).values(flagRows);
  console.log(`domain_flags: ${flagRows.length} rows`);

  await db.delete(replacements);
  const replacementRows = seed.replacements.map((r) => ({
    newDomain: r.newDomain,
    oldDomain: r.oldDomain,
    client: r.client,
    campaignTitle: r.campaignTitle,
    campaignId: r.campaignId,
    reason: r.reason,
    date: r.date,
  }));
  if (replacementRows.length) await db.insert(replacements).values(replacementRows);
  console.log(`replacements: ${replacementRows.length} rows`);

  await db.delete(notes);
  const noteRows = seed.replacements.map((r) => ({
    ts: new Date(`${r.date}T00:00:00Z`),
    author: "2026 audit migration",
    type: "replacement" as const,
    target: `${r.oldDomain} → ${r.newDomain}`,
    text: r.reason,
  }));
  if (noteRows.length) await db.insert(notes).values(noteRows);
  console.log(`notes: ${noteRows.length} rows`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
