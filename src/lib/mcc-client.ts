// Generic area/action HTTP client for the MCC platform's white-label API (brief §4).
// The exact auth format (header vs query param) and base URL are unknown until the
// user pulls a real API key from the platform's own dashboard — that's isolated to
// authHeaders()/buildUrl() below so swapping it in later is a small, contained change.

const BASE_URL = process.env.MCC_API_BASE_URL;
const API_KEY = process.env.MCC_API_KEY;

export function mccConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY);
}

function buildUrl(area: string, action: string, params: Record<string, string> = {}) {
  const url = new URL(BASE_URL!);
  url.searchParams.set("area", area);
  url.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

function authHeaders(): Record<string, string> {
  // Default assumption: bearer token in the Authorization header. Change here (and
  // only here) if the platform's real docs say it wants the key as a query param
  // or a different header name instead.
  return { Authorization: `Bearer ${API_KEY}` };
}

export async function mccGet<T = unknown>(
  area: string,
  action: string,
  params: Record<string, string> = {},
): Promise<T> {
  if (!mccConfigured()) {
    throw new Error("MCC_API_BASE_URL / MCC_API_KEY are not set");
  }
  const res = await fetch(buildUrl(area, action, params), {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`MCC API ${area}/${action} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
