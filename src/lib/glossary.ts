// Plain-English explanations shown in tooltips throughout the app. Keeping
// them here means the wording only has to be right once.

const HTTPS_EXPLAINER =
  "HTTPS is the little padlock browsers show for a secure site. Links inside these emails (tracking pixels, unsubscribe links, images) point back to this domain — if HTTPS is off, some email clients and browsers flag it as unsafe, which hurts trust and can hurt delivery.";

const DMARC_EXPLAINER =
  "DMARC is a setting that stops other people from faking emails that look like they came from this domain. 'Reject' is the strict, correct setting — anything else is worth double-checking.";

export const GAUGE_HELP = {
  campaignsInFlight: "Campaigns currently set to send (status: Pending). Paused and completed campaigns aren't counted.",
  flaggedDomains: "Domains someone has manually marked as blacklisted (SBL or DBL) after checking Spamhaus or similar. This isn't checked automatically — see Domains for details.",
  expiringSoon: "Domains whose registration expires within 60 days, whether or not that actually needs action. Check the 'Needs renewal' flag on the Domains tab for the ones that really do.",
  httpsCoverage: `Percentage of domains with HTTPS turned on. ${HTTPS_EXPLAINER}`,
  spareProfiles: "Sending profiles (domain + IP pairs) that exist on the platform but aren't assigned to any campaign — available to use for a new campaign or a replacement.",
} as const;

export const CAMPAIGN_HELP = {
  status: "Pending = actively sending. Paused = temporarily stopped. Completed = finished its run.",
  domain: "The domain this campaign's emails actually go out from.",
  profile: "The 'sending profile' ties a campaign to one domain + IP. No profile means the campaign can't send at all. 'Mismatch' flags a known platform bug where the assigned profile doesn't match what the campaign is really using — worth checking against the client name on the left before assuming it's fixed.",
  dmarc: DMARC_EXPLAINER,
  flags: "SBL = manually flagged as blacklisted by Spamhaus. New domain = this campaign's domain was purchased/switched during a past cleanup.",
} as const;

export const DOMAIN_HELP = {
  status: "The domain's status on the sending platform (e.g. 'Domain Ready').",
  dmarc: DMARC_EXPLAINER,
  expires: "When the domain's registration expires, and how many days remain.",
  autoRenew: "Whether the registrar will renew this domain automatically. If it's off and the domain is still in use, someone needs to renew it manually before it expires.",
  profileIp: "The sending profile and IP address assigned to this domain, if any.",
  usedBy: "How many campaigns currently send from this domain.",
  flags: "SBL / DBL = manually flagged as blacklisted after a human check (Spamhaus, etc.) — not automatic. Replaced = this domain replaced an older one; hover for details. Needs renewal = auto-renew is off, it's expiring soon (or already expired), and a campaign is still using it.",
} as const;

export function replacementTooltip(info: { oldDomain: string; reason: string; date: string }): string {
  return `Replaced ${info.oldDomain} on ${info.date} — ${info.reason}`;
}
