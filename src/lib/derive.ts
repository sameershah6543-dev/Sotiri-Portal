import type { AttentionItem, GaugeCounts, PlatformCampaign, ViewCampaign, ViewDomain } from "@/types";

export function daysLeft(expireDate: string, now: Date = new Date()): number {
  const expiry = new Date(`${expireDate}T00:00:00Z`);
  const ms = expiry.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// "CFN 05 Gaubert Oil" -> "Gaubert Oil"; strips a leading campaign-code token if present.
export function clientFromTitle(title: string): string {
  const match = title.match(/^[A-Z0-9]+\s+\d+\s+(.+)$/);
  return match ? match[1] : title;
}

export function hasProfileMismatch(campaign: PlatformCampaign): boolean {
  if (campaign.rotatedProfileId === undefined) return false;
  if (campaign.profileId === null || campaign.rotatedProfileId === null) return false;
  return campaign.profileId !== campaign.rotatedProfileId;
}

export function buildAttentionList(
  campaigns: ViewCampaign[],
  domains: ViewDomain[],
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const d of domains) {
    if (d.sbl || d.dbl) {
      items.push({
        severity: "critical",
        label: d.domain,
        detail: [d.sbl && "SBL-listed", d.dbl && "DBL-listed"].filter(Boolean).join(", "),
        href: `/domains?q=${encodeURIComponent(d.domain)}`,
      });
    }
  }

  for (const c of campaigns) {
    if (!c.profileId) {
      items.push({
        severity: "critical",
        label: c.title,
        detail: "No sending profile assigned",
        href: `/campaigns?q=${encodeURIComponent(c.title)}`,
      });
    }
    if (c.sbl) {
      items.push({
        severity: "critical",
        label: c.title,
        detail: `Sending from an SBL-flagged domain (${c.domain})`,
        href: `/campaigns?q=${encodeURIComponent(c.title)}`,
      });
    }
    if (c.profileMismatch) {
      items.push({
        severity: "critical",
        label: c.title,
        detail: "profileId and rotatedprofiles.profile.profileid disagree",
        href: `/campaigns?q=${encodeURIComponent(c.title)}`,
      });
    }
  }

  for (const d of domains) {
    if (d.daysLeft <= 60 && d.daysLeft >= 0 && d.renew === "No") {
      items.push({
        severity: "warning",
        label: d.domain,
        detail: `Expires in ${d.daysLeft} days, auto-renew is off`,
        href: `/domains?q=${encodeURIComponent(d.domain)}`,
      });
    } else if (d.daysLeft <= 60 && d.daysLeft >= 0) {
      items.push({
        severity: "warning",
        label: d.domain,
        detail: `Expires in ${d.daysLeft} days`,
        href: `/domains?q=${encodeURIComponent(d.domain)}`,
      });
    }
  }

  const severityRank = { critical: 0, warning: 1 } as const;
  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function buildGaugeCounts(campaigns: ViewCampaign[], domains: ViewDomain[], spareProfiles: number): GaugeCounts {
  const inFlight = campaigns.filter((c) => c.status === "Pending").length;
  const flagged = domains.filter((d) => d.sbl || d.dbl).length;
  const expiringSoon = domains.filter((d) => d.daysLeft <= 60 && d.daysLeft >= 0).length;
  const httpsOn = domains.filter((d) => d.https).length;
  const httpsCoveragePct = domains.length === 0 ? 0 : Math.round((httpsOn / domains.length) * 100);

  return {
    campaignsInFlight: inFlight,
    flaggedDomains: flagged,
    expiringSoon,
    httpsCoveragePct,
    spareProfiles: spareProfiles,
  };
}
