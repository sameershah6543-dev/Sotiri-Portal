// Notifies the team on Microsoft Teams when a client files a request.
// Safely no-ops without TEAMS_WEBHOOK_URL, same pattern as notify.ts/mcc-client.ts.
// Points at a Power Automate flow's HTTP trigger (not the legacy "Incoming
// Webhook" connector) — Microsoft's standard "Post to a Teams chat/channel
// when a webhook request is received" template, which posts whatever's in
// the `text` field of the JSON body into the configured chat.

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

  const text =
    `**New portal request: ${params.subject}**\n\n` +
    `Type: ${params.type}\n\n` +
    `From: ${params.requestedBy}\n\n` +
    params.description;

  const res = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      subject: params.subject,
      type: params.type,
      description: params.description,
      requestedBy: params.requestedBy,
    }),
  });

  if (!res.ok) {
    console.error("[teams] webhook post failed", res.status, await res.text());
  }
}
