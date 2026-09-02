import { NextRequest, NextResponse } from "next/server";
import { mccConfigured, mccGet } from "@/lib/mcc-client";
import { upsertSnapshot } from "@/db/queries";
import type { AccountInfo, PlatformCampaign, PlatformDomain, UnusedProfile } from "@/types";

export const maxDuration = 60;

// The real platform payload shape is unknown until MCC_API_KEY is live (build
// plan step 6) — this stands in for whatever getcampaigns/getdomains/etc.
// actually return, with field access cast per brief §3/§4 below.
type RawRecord = Record<string, unknown>;

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
// campaign-detail sweep doesn't hammer the platform with 179 concurrent requests.
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
    // Field names below follow brief §3/§4. Confirm against the real payload
    // shape once MCC_API_KEY is live (build plan step 6) and adjust here only.
    const [rawCampaigns, rawDomains, rawProfiles, rawAccount] = await Promise.all([
      mccGet<RawRecord[]>("email", "getcampaigns"),
      mccGet<RawRecord[]>("email", "getdomains"),
      mccGet<RawRecord[]>("email", "getsendingprofiles"),
      mccGet<RawRecord>("email", "getaccountinfo"),
    ]);

    const campaigns: PlatformCampaign[] = await mapWithConcurrency(rawCampaigns, 8, async (c) => {
      let rotatedProfileId: string | null | undefined;
      try {
        const detail = await mccGet<RawRecord>("email", "getcampaigndetail", { id: String(c.id) });
        const rotatedprofiles = detail.rotatedprofiles as RawRecord | undefined;
        const profile = rotatedprofiles?.profile as RawRecord | undefined;
        rotatedProfileId = (profile?.profileid as string | undefined) ?? null;
      } catch (err) {
        console.warn(`[refresh] getcampaigndetail failed for campaign ${c.id}`, err);
      }
      return {
        id: String(c.id),
        title: c.title as string,
        status: c.status as PlatformCampaign["status"],
        profileId: (c.profileid as string | null) ?? null,
        domain: c.domain as string,
        https: Boolean(c.https),
        dmarc: c.dmarc as string,
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
        https: Boolean(d.https),
        dmarc: d.dmarc as string,
        expireDate: d.expiredateiso as string,
        renew: d.autorenew ? "Yes" : "No",
        hasProfile: Boolean(d.profileid),
        profileId: (d.profileid as string | null) ?? null,
        ip: (d.ip as string | null) ?? null,
        usedByCampaigns: usedByCampaigns.get(domain) ?? [],
      };
    });

    const unusedProfiles: UnusedProfile[] = rawProfiles
      .filter((p) => !assignedProfileIds.has(String(p.id)))
      .map((p) => ({ profileId: String(p.id), domain: p.domain as string, ip: p.ip as string }));

    const accountInfo: AccountInfo = {
      billingPeriodStart: rawAccount.billingperiodstart as string,
      billingPeriodEnd: rawAccount.billingperiodend as string,
      packageSize: Number(rawAccount.packagesize),
      sentThisCycle: Number(rawAccount.sentthiscycle),
      totalIps: Number(rawAccount.totalips),
      complaints: Number(rawAccount.complaints),
    };

    await upsertSnapshot({ campaigns, domains, unusedProfiles, accountInfo });

    return NextResponse.json({ ok: true, campaigns: campaigns.length, domains: domains.length });
  } catch (err) {
    console.error("[refresh] failed", err);
    return NextResponse.json({ error: "Refresh failed, see server logs" }, { status: 500 });
  }
}
