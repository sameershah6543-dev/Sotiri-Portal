import { NextRequest, NextResponse } from "next/server";
import { mccConfigured, mccGet } from "@/lib/mcc-client";
import { upsertSnapshot, listDomainsNeedingRenewalEmail } from "@/db/queries";
import { sendRenewalAlertEmail } from "@/lib/notify";
import { computeNeedsRenewal, daysLeft } from "@/lib/derive";
import type { AccountInfo, PlatformCampaign, PlatformDomain, UnusedProfile } from "@/types";

export const maxDuration = 60;

// Confirmed against a live pull (2026-09-25) rather than assumed from the
// brief — the real payloads differ from what §3/§4 originally guessed at.
type RawRecord = Record<string, unknown>;

// Only these campaign-title prefixes are treated as this portal's book of
// business. The live account also carries ~1400 "PP"-titled and ~40
// "Northland"-titled campaigns etc. that belong to unrelated clients on the
// same shared MCC account — confirm this list is complete/correct before
// relying on it; it's the one part of this file that isn't just "what the
// API returns," it's a business-scope judgment call.
const RELEVANT_TITLE_PREFIXES = ["CFN", "Spinx", "PAWP"];

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
// CRON_SECRET is set in the project's env vars — see vercel.json.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Runs `fn` over `items` with at most `limit` in flight at once, so a full
// campaign-detail sweep doesn't hammer the platform with hundreds of
// concurrent requests.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// The list endpoints (getcampaigns/getdomains) are paginated — `records` on
// the first page tells us the true total, so keep paging until we have it all.
async function fetchAllPages(
  action: string,
  itemsKey: string,
  pageSize = 1000,
): Promise<RawRecord[]> {
  const first = await mccGet<RawRecord>("email", action, { start: "0", limit: String(pageSize) });
  const total = Number(first.records ?? 0);
  let items = (first[itemsKey] as RawRecord[] | undefined) ?? [];
  for (let start = items.length; start < total; start += pageSize) {
    const page = await mccGet<RawRecord>("email", action, {
      start: String(start),
      limit: String(pageSize),
    });
    items = items.concat((page[itemsKey] as RawRecord[] | undefined) ?? []);
  }
  return items;
}

// Vercel Cron triggers a GET request; POST is kept too so it can be triggered
// manually (e.g. `curl -X POST` with the same bearer token) while testing.
export async function GET(req: NextRequest) {
  return handleRefresh(req);
}

export async function POST(req: NextRequest) {
  return handleRefresh(req);
}

async function handleRefresh(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  if (!mccConfigured()) {
    console.warn(
      "[refresh] MCC_API_BASE_URL / MCC_API_KEY not set — skipping pull, platform_snapshot left untouched.",
    );
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const [rawCampaignList, rawDomains, rawProfiles, rawAccount] = await Promise.all([
      fetchAllPages("getcampaigns", "campaign"),
      fetchAllPages("getdomains", "domain"),
      fetchAllPages("getsendingprofiles", "profile"),
      mccGet<RawRecord>("email", "getaccountinfo"),
    ]);

    // Only pull full detail (domain/profile/rotation) for campaigns that
    // matter to this portal: active (not Completed) and in-scope by title.
    const relevantCampaigns = rawCampaignList.filter((c) => {
      const status = c.status as string;
      const title = c.title as string;
      return status !== "Completed" && RELEVANT_TITLE_PREFIXES.some((p) => title.startsWith(p));
    });

    const campaigns: PlatformCampaign[] = await mapWithConcurrency(relevantCampaigns, 8, async (c) => {
      const detail = await mccGet<RawRecord>("email", "getcampaigndetail", { id: String(c.id) });
      const rotatedprofiles = detail.rotatedprofiles as RawRecord | undefined;
      const profile = rotatedprofiles?.profile as RawRecord | undefined;
      const rotatedProfileId = (profile?.profileid as string | undefined) ?? null;
      return {
        id: String(c.id),
        title: detail.title as string,
        status: detail.status as PlatformCampaign["status"],
        profileId: (detail.profileid as string | null) ?? null,
        domain: detail.domain as string,
        rotatedProfileId,
      };
    });

    const usedByCampaigns = new Map<string, string[]>();
    for (const c of campaigns) {
      const list = usedByCampaigns.get(c.domain) ?? [];
      list.push(c.id);
      usedByCampaigns.set(c.domain, list);
    }

    const assignedProfileIds = new Set(campaigns.map((c) => c.profileId).filter(Boolean));

    const domains: PlatformDomain[] = rawDomains.map((d) => {
      const domain = d.domain as string;
      return {
        domain,
        domainId: String(d.id),
        status: d.status as string,
        https: d.https === "1" || d.https === true,
        dmarc: d.dmarcpolicy as string,
        expireDate: (d.expiredateiso as string).slice(0, 10),
        hasProfile: usedByCampaigns.has(domain) || assignedProfileIds.has(domain),
        profileId: null,
        ip: null,
        usedByCampaigns: usedByCampaigns.get(domain) ?? [],
      };
    });

    // Sending profiles carry the domain/IP pairing directly (domains
    // themselves don't) — backfill profileId/ip/hasProfile from there.
    const profileByDomain = new Map(rawProfiles.map((p) => [p.domain as string, p]));
    for (const domain of domains) {
      const profile = profileByDomain.get(domain.domain);
      if (profile) {
        domain.profileId = String(profile.id);
        domain.ip = profile.ip as string;
        domain.hasProfile = true;
      }
    }

    const unusedProfiles: UnusedProfile[] = rawProfiles
      .filter((p) => !assignedProfileIds.has(String(p.id)))
      .map((p) => ({ profileId: String(p.id), domain: p.domain as string, ip: p.ip as string }));

    // The live payload has one combined "billingperiod" string, not separate
    // start/end fields — stored as-is rather than parsed, to avoid brittle
    // date-format guessing.
    const accountInfo: AccountInfo = {
      billingPeriod: rawAccount.billingperiod as string,
      packageSize: Number(String(rawAccount.packagesize).replace(/,/g, "")),
      sentThisCycle: Number(String(rawAccount.emailsentcycle).replace(/,/g, "")),
      totalIps: Number(rawAccount.totalips),
      complaints: Number(rawAccount.complaints),
    };

    await upsertSnapshot({ campaigns, domains, unusedProfiles, accountInfo });

    // Anything expiring soon (or expired), still in use, and not yet marked
    // renewed by the team gets a batched alert — see src/lib/notify.ts.
    const stillNeedsRenewal = await listDomainsNeedingRenewalEmail();
    const needsRenewalNow = domains.filter((d) => {
      const flagged = stillNeedsRenewal.get(d.domain);
      return computeNeedsRenewal({
        daysLeft: daysLeft(d.expireDate),
        renewMarked: flagged?.renewMarked ?? false,
        usedByCampaigns: d.usedByCampaigns,
      });
    });
    if (needsRenewalNow.length > 0) {
      await sendRenewalAlertEmail(
        needsRenewalNow.map((d) => ({ domain: d.domain, expireDate: d.expireDate, daysLeft: daysLeft(d.expireDate) })),
      );
    }

    return NextResponse.json({ ok: true, campaigns: campaigns.length, domains: domains.length });
  } catch (err) {
    console.error("[refresh] failed", err);
    return NextResponse.json({ error: "Refresh failed, see server logs" }, { status: 500 });
  }
}
