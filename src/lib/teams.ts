// Notifies the team's Microsoft Teams channel when a client files a request.
// Safely no-ops without TEAMS_WEBHOOK_URL, same pattern as notify.ts/mcc-client.ts.
// Uses a Teams "Incoming Webhook" channel connector — Teams channel → ⋯ →
// Connectors → Incoming Webhook → copy the URL into that env var.

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

export async function sendRequestTeamsNotification(params: {
  subject: string;
  type: string;
  description: string;
  requestedBy: string;
}): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) {
    console.warn("[teams] TEAMS_WEBHOOK_URL not set — skipping Teams notification for new request.");
    return;
  }

  const res = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "1B6B72",
      summary: `New portal request: ${params.subject}`,
      title: `New request: ${params.subject}`,
      text: `**Type:** ${params.type}\n\n**From:** ${params.requestedBy}\n\n${params.description}`,
    }),
  });

  if (!res.ok) {
    console.error("[teams] webhook post failed", res.status, await res.text());
  }
}
