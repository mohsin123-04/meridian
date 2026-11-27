# Meridian

Meeting intelligence for teams. Connects to Zoom and Google Meet, pulls transcripts, and uses Gemini to extract decisions, action items, and a health score for every meeting. Results show up in a dashboard your whole workspace shares.

## What it does

- Automatically captures meetings from Zoom (via webhook) and Google Meet (via Calendar API polling)
- Runs transcripts through Gemini and extracts decisions, action items, participants, and an efficiency score
- Posts a summary to Slack when a meeting finishes processing
- Tracks action items across meetings with status toggling
- Generates pre-meeting briefs based on past meeting history with the same attendees
- Manual transcript upload for testing or one-off imports

## Stack

- **Next.js 16** (App Router, server actions, server components)
- **Supabase** (Postgres, Auth, RLS)
- **Gemini 2.5 Flash** for transcript analysis
- **Tailwind CSS v4**
- Deployed on Vercel

## Running locally

```bash
npm install
npm run dev
```

You need a `.env.local` with the following:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Zoom OAuth
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_WEBHOOK_SECRET_TOKEN=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini
GEMINI_API_KEY=

# Slack OAuth
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
```

## Database

Schema is in `supabase/schema.sql`. Run it against a fresh Supabase project. The main tables are `workspaces`, `profiles`, `meetings`, `decisions`, `action_items`, `meeting_health`, `meeting_participants`, and `integrations`.

RLS is enabled on all tables. Server-side privileged operations (processing, OAuth callbacks) use the service role key via `createAdminClient()`.

## Processing pipeline

When a meeting ends, a webhook (Zoom) or calendar poll (Google Meet) creates a meeting row with status `pending`. The `/api/process-meeting` endpoint handles Gemini extraction with retry logic for 503s. Status updates are polled every 2 seconds on the meeting detail page so results appear without a manual refresh.

## OAuth integrations

Zoom and Google Meet need their redirect URIs configured in their respective developer portals. Slack requires a bot token and uses `refresh_token` to store the target channel ID.

## Deployment

Push to `main` deploys automatically via Vercel. The `maxDuration = 60` on the process-meeting route is required -- Gemini + DB writes can take a while.
