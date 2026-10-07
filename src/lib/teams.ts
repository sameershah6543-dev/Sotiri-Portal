// Notifies the team on Microsoft Teams when a client files a request.
// Safely no-ops without TEAMS_WEBHOOK_URL, same pattern as notify.ts/mcc-client.ts.
// Points at a Power Automate flow built from Microsoft's "Post a card in a
// chat or channel when a webhook request is received" template — that flow
// passes the request body straight into the "Post card" action, so the body
// itself must BE a valid Adaptive Card (confirmed from a failed run: "Property
// 'type' must be 'AdaptiveCard'"), not a flat {text: "..."} object.

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

function escapeMarkdown(text: string): string {
  return text.replace(/([*_~`])/g, "\\$1");
}

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

  const card = {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        size: "Medium",
        weight: "Bolder",
        text: `New request: ${escapeMarkdown(params.subject)}`,
        wrap: true,
      },
      {
        type: "TextBlock",
        text: `Type: ${params.type}  ·  From: ${params.requestedBy}`,
        isSubtle: true,
        wrap: true,
      },
      {
        type: "TextBlock",
        text: escapeMarkdown(params.description),
        wrap: true,
      },
    ],
  };

  const res = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!res.ok) {
    console.error("[teams] webhook post failed", res.status, await res.text());
  }
}
