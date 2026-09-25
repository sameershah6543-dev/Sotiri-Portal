// Plain-English explanations shown in tooltips throughout the app. Keeping
// them here means the wording only has to be right once.

export const GAUGE_HELP = {
  campaignsInFlight: "Campaigns currently set to send (status: Pending). Paused and completed campaigns aren't counted.",
  flaggedDomains: "Domains someone has manually marked as blacklisted (SBL or DBL) after checking Spamhaus or similar. This isn't checked automatically — see Domains for details.",
  expiringSoon: "Domains whose registration expires within 60 days, whether or not that actually needs action. Check the 'Needs renewal' flag on the Domains tab for the ones that really do.",
  spareProfiles: "Sending profiles (domain + IP pairs) that exist on the platform but aren't assigned to any campaign — available to use for a new campaign or a replacement.",
} as const;

export const CAMPAIGN_HELP = {
  status: "Pending = actively sending. Paused = temporarily stopped. Completed = finished its run.",
  domain: "The domain this campaign's emails actually go out from.",
  profile: "The 'sending profile' ties a campaign to one domain + IP. No profile means the campaign can't send at all. 'Mismatch' flags a known platform bug where the assigned profile doesn't match what the campaign is really using — worth checking against the client name on the left before assuming it's fixed.",
  flags: "SBL = manually flagged as blacklisted by Spamhaus. New domain = this campaign's domain was purchased/switched during a past cleanup.",
} as const;

export const DOMAIN_HELP = {
  status: "The domain's status on the sending platform (e.g. 'Domain Ready').",
  expires: "When the domain's registration expires, and how many days remain.",
  renewal: "The MCC platform doesn't track auto-renewal at all — this is entirely tracked by your team. Mark a domain once you've renewed it (or confirmed the registrar will); if it's still marked 'Not marked' as the expiry date gets close and a campaign is using it, it'll show up as needing attention.",
  profileIp: "The sending profile and IP address assigned to this domain, if any.",
  usedBy: "How many campaigns currently send from this domain.",
  flags: "SBL / DBL = manually flagged as blacklisted after a human check (Spamhaus, etc.) — not automatic; if a campaign is still using a flagged domain it's marked REPLACE ASAP. Replaced = this domain replaced an older one; hover for details. Needs renewal = not marked for renewal, expiring soon (or already expired), and a campaign is still using it.",
} as const;

export function replacementTooltip(info: { oldDomain: string; reason: string; date: string }): string {
  return `Replaced ${info.oldDomain} on ${info.date} — ${info.reason}`;
}
