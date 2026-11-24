const ZOOM_API = "https://api.zoom.us/v2";
const ZOOM_OAUTH = "https://zoom.us/oauth";

export function getZoomAuthUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zoom/callback`,
    state,
  });
  return `${ZOOM_OAUTH}/authorize?${params}`;
}

export async function exchangeZoomCode(code: string) {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${ZOOM_OAUTH}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zoom/callback`,
    }),
  });

  if (!res.ok) throw new Error(`Zoom token exchange failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  }>;
}

export async function refreshZoomToken(refreshToken: string) {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${ZOOM_OAUTH}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Zoom token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function getZoomRecordings(accessToken: string, userId = "me") {
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `${ZOOM_API}/users/${userId}/recordings?from=${from}&page_size=30`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`Failed to fetch recordings: ${res.status}`);
  return res.json();
}

export async function getZoomRecordingFiles(accessToken: string, meetingId: string) {
  const res = await fetch(`${ZOOM_API}/meetings/${meetingId}/recordings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch recording files: ${res.status}`);
  return res.json();
}

export async function downloadZoomTranscript(
  accessToken: string,
  downloadUrl: string
): Promise<string> {
  const res = await fetch(`${downloadUrl}?access_token=${accessToken}`);
  if (!res.ok) throw new Error(`Failed to download transcript: ${res.status}`);
  return res.text();
}

export function verifyZoomWebhook(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const message = `v0:${timestamp}:${body}`;
  const hash = crypto
    .createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET_TOKEN!)
    .update(message)
    .digest("hex");
  return `v0=${hash}` === signature;
}
