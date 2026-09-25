// Email alerts for domains that need renewal action, sent via Resend
// (https://resend.com — free tier, no domain verification needed to send
// from their shared onboarding@resend.dev sender to a fixed address).
// Safely no-ops without RESEND_API_KEY, same pattern as mcc-client.ts — the
// portal's own "Needs renewal" flag/Attention rail always works regardless,
// this is purely an additional heads-up.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL_TO = process.env.RENEWAL_ALERT_EMAIL || "sameer@mailclickconvert.net";

export async function sendRenewalAlertEmail(
  domains: Array<{ domain: string; expireDate: string; daysLeft: number }>,
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[notify] RESEND_API_KEY not set — skipping renewal email for ${domains.length} domain(s). The portal's Attention rail still shows them.`,
    );
    return;
  }
  if (domains.length === 0) return;

  const rows = domains
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(
      (d) =>
        `<tr><td style="padding:4px 12px 4px 0">${d.domain}</td><td style="padding:4px 12px">${d.expireDate}</td><td style="padding:4px">${
          d.daysLeft < 0 ? `expired ${Math.abs(d.daysLeft)}d ago` : `${d.daysLeft}d left`
        }</td></tr>`,
    )
    .join("");

  const html = `
    <p>${domains.length} domain(s) need renewal attention — not marked renewed in the portal, and still in use by a campaign:</p>
    <table style="border-collapse:collapse">${rows}</table>
    <p>Mark them renewed at the portal once handled, or check why they're still showing this way.</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MCC Sending Manifest <onboarding@resend.dev>",
      to: [ALERT_EMAIL_TO],
      subject: `${domains.length} domain(s) need renewal — MCC Sending Manifest`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[notify] Resend email failed", res.status, await res.text());
  }
}
