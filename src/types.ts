// Platform-sourced shapes (overwritten wholesale on every /api/refresh pull).
// Only built from email/getcampaigndetail — the list endpoint (getcampaigns)
// doesn't return domain/profileid/https/dmarc at all (confirmed live).
export type PlatformCampaign = {
  id: string;
  title: string;
  status: "Pending" | "Paused" | "Completed";
  profileId: string | null;
  domain: string;
  // Used to catch the profileid vs rotatedprofiles mismatch landmine
  // documented in the brief §4.
  rotatedProfileId: string | null;
};

export type PlatformDomain = {
  domain: string;
  domainId: string;
  status: string;
  https: boolean;
  dmarc: string;
  expireDate: string; // YYYY-MM-DD
  hasProfile: boolean;
  profileId: string | null;
  ip: string | null;
  usedByCampaigns: string[];
};

export type UnusedProfile = {
  profileId: string;
  domain: string;
  ip: string;
};

export type AccountInfo = {
  billingPeriod: string; // e.g. "August 28, 2026 - September 28, 2026, 12:00 am" — one combined string from the platform, not separate start/end fields
  packageSize: number;
  sentThisCycle: number;
  totalIps: number;
  complaints: number;
};

// Manually-entered shapes (never overwritten by a refresh).
export type DomainFlag = {
  domain: string;
  sbl: boolean;
  dbl: boolean;
  renewMarked: boolean;
  originalNote: string | null;
};

export type Replacement = {
  id: number;
  newDomain: string;
  oldDomain: string;
  client: string;
  campaignTitle: string;
  campaignId: string;
  reason: string;
  date: string; // YYYY-MM-DD
};

export type NoteType =
  | "sbl-on"
  | "sbl-off"
  | "dbl-on"
  | "dbl-off"
  | "renewal-marked"
  | "renewal-unmarked"
  | "note"
  | "replacement";

export type Note = {
  id: number;
  ts: string; // ISO timestamp
  author: string;
  type: NoteType;
  target: string;
  text: string;
};

export type Role = "team" | "client";

// The merged view model the UI actually renders (snapshot + overrides + derived fields).
export type ViewCampaign = PlatformCampaign & {
  client: string; // derived from title, e.g. "CFN 05 Gaubert Oil" -> "Gaubert Oil"
  sbl: boolean; // from the campaign's domain's flag
  isNewDomain: boolean; // domain appears as a replacement's newDomain
  profileMismatch: boolean; // profileId !== rotatedProfileId when both present
};

export type ReplacedFrom = {
  oldDomain: string;
  reason: string;
  date: string;
};

export type ViewDomain = PlatformDomain & {
  daysLeft: number;
  sbl: boolean;
  dbl: boolean;
  renewMarked: boolean; // manual — team confirms they've renewed/checked this domain
  originalNote: string | null;
  isNewDomain: boolean;
  replacedFrom: ReplacedFrom | null;
  // True only when it isn't marked renewed, it's actually expiring soon (or
  // already expired), AND a campaign is still using it — an unused expiring
  // domain is fine to let lapse (brief §3's jacksonoilsolventsinc.com
  // example), so it's deliberately not flagged here.
  needsRenewal: boolean;
};

export type AttentionItem = {
  severity: "critical" | "warning";
  label: string;
  detail: string;
  href: string;
};

export type GaugeCounts = {
  campaignsInFlight: number;
  flaggedDomains: number;
  expiringSoon: number;
  spareProfiles: number;
};
