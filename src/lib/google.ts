const GOOGLE_OAUTH = "https://oauth2.googleapis.com";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const MEET_API = "https://meet.googleapis.com/v2";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/meetings.space.readonly",
].join(" ");

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const res = await fetch(`${GOOGLE_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  }>;
}

export async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch(`${GOOGLE_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get Google user info");
  const data = await res.json();
  return data.email;
}

// Get calendar events that ended in the last N hours
export async function getRecentCalendarEvents(accessToken: string, hoursBack = 2) {
  const timeMin = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const timeMax = new Date().toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Calendar API failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []) as GoogleCalendarEvent[];
}

// Get upcoming calendar events (for pre-meeting briefs)
export async function getUpcomingCalendarEvents(accessToken: string, hoursAhead = 24) {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "10",
  });

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Calendar API failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []) as GoogleCalendarEvent[];
}

// Get Meet conference records (transcripts live here)
export async function getMeetConferenceRecords(accessToken: string) {
  const res = await fetch(`${MEET_API}/conferenceRecords?pageSize=20`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Meet API failed: ${res.status}`);
  const data = await res.json();
  return (data.conferenceRecords ?? []) as MeetConferenceRecord[];
}

export async function getMeetTranscripts(accessToken: string, conferenceRecordName: string) {
  const res = await fetch(`${MEET_API}/${conferenceRecordName}/transcripts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Meet transcripts API failed: ${res.status}`);
  const data = await res.json();
  return (data.transcripts ?? []) as MeetTranscript[];
}

export async function getMeetTranscriptEntries(
  accessToken: string,
  transcriptName: string
): Promise<string> {
  const res = await fetch(`${MEET_API}/${transcriptName}/entries?pageSize=1000`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Meet transcript entries API failed: ${res.status}`);
  const data = await res.json();

  const entries: MeetTranscriptEntry[] = data.entries ?? [];
  return entries
    .map((e) => `[${e.startTime}] ${e.participantName}: ${e.text}`)
    .join("\n");
}

// Types
export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { name: string };
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
}

export interface MeetConferenceRecord {
  name: string;
  startTime: string;
  endTime?: string;
  space?: { name: string; meetingCode: string };
}

export interface MeetTranscript {
  name: string;
  state: string;
  startTime?: string;
  endTime?: string;
  docsDestination?: { document: string };
}

export interface MeetTranscriptEntry {
  name: string;
  participantName: string;
  text: string;
  startTime: string;
  endTime: string;
}
