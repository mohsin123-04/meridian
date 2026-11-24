-- ============================================================
-- Meridian Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search on decisions

-- ============================================================
-- WORKSPACES
-- A workspace = one company / team
-- ============================================================
create table workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  workspace_id  uuid references workspaces(id) on delete set null,
  full_name     text,
  avatar_url    text,
  role          text not null default 'member' check (role in ('admin', 'member')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INTEGRATIONS
-- Stores OAuth tokens for Zoom / Google per user
-- ============================================================
create table integrations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  provider        text not null check (provider in ('zoom', 'google')),
  access_token    text not null,
  refresh_token   text,
  token_expires_at timestamptz,
  scope           text,
  provider_user_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, provider)
);

-- ============================================================
-- MEETINGS
-- One row per meeting session
-- ============================================================
create table meetings (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  source          text not null check (source in ('zoom', 'google_meet', 'manual')),
  external_id     text,                        -- Zoom meeting ID or Meet conference ID
  title           text,
  started_at      timestamptz,
  ended_at        timestamptz,
  duration_mins   int,
  transcript      text,                        -- raw transcript text
  transcript_url  text,                        -- storage path if stored in Supabase storage
  status          text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'failed')),
  series_id       uuid,                        -- FK set after meeting_series is created
  created_at      timestamptz not null default now(),
  unique (workspace_id, source, external_id)
);

-- ============================================================
-- MEETING PARTICIPANTS
-- ============================================================
create table meeting_participants (
  id          uuid primary key default uuid_generate_v4(),
  meeting_id  uuid not null references meetings(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  name        text not null,                   -- display name from meeting platform
  email       text,
  talk_time_secs int default 0
);

-- ============================================================
-- DECISIONS
-- AI-extracted decisions from each meeting
-- ============================================================
create table decisions (
  id            uuid primary key default uuid_generate_v4(),
  meeting_id    uuid not null references meetings(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  summary       text not null,                 -- one-sentence decision
  context       text,                          -- why / alternatives considered
  topics        text array default '{}',        -- tag array e.g. ['product', 'hiring']
  made_at       timestamptz,                   -- timestamp within the meeting
  created_at    timestamptz not null default now()
);

-- Full-text search index on decisions
create index decisions_summary_trgm on decisions using gin (summary gin_trgm_ops);
create index decisions_workspace_id on decisions (workspace_id);

-- ============================================================
-- ACTION ITEMS
-- AI-extracted tasks from each meeting
-- ============================================================
create table action_items (
  id            uuid primary key default uuid_generate_v4(),
  meeting_id    uuid not null references meetings(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  owner_id      uuid references profiles(id) on delete set null,
  owner_name    text,                          -- fallback if owner not in profiles
  description   text not null,
  due_date      date,
  status        text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index action_items_workspace_status on action_items (workspace_id, status);

-- ============================================================
-- MEETING HEALTH
-- Computed analytics per meeting, stored after processing
-- ============================================================
create table meeting_health (
  id                    uuid primary key default uuid_generate_v4(),
  meeting_id            uuid not null unique references meetings(id) on delete cascade,
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  efficiency_score      int check (efficiency_score between 0 and 100),
  decision_count        int default 0,
  action_item_count     int default 0,
  recurring_topics      text array default '{}',  -- topics flagged as recurring
  dominant_speaker      text,                 -- name of person with most talk time
  scheduled_mins        int,
  actual_mins           int,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- MEETING SERIES
-- Groups recurring meetings together
-- ============================================================
create table meeting_series (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  title         text not null,
  cadence       text,                          -- e.g. 'weekly', 'biweekly'
  created_at    timestamptz not null default now()
);

-- Back-reference from meetings to series
alter table meetings add constraint meetings_series_fk
  foreign key (series_id) references meeting_series(id) on delete set null;

-- ============================================================
-- PRE-MEETING BRIEFS
-- Generated and stored before each scheduled meeting
-- ============================================================
create table meeting_briefs (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  meeting_id        uuid references meetings(id) on delete cascade,
  calendar_event_id text,                      -- Google Calendar event ID
  generated_at      timestamptz not null default now(),
  brief             jsonb not null,            -- { open_items, past_decisions, suggested_topics }
  delivered         boolean default false
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table workspaces          enable row level security;
alter table profiles            enable row level security;
alter table integrations        enable row level security;
alter table meetings            enable row level security;
alter table meeting_participants enable row level security;
alter table decisions           enable row level security;
alter table action_items        enable row level security;
alter table meeting_health      enable row level security;
alter table meeting_series      enable row level security;
alter table meeting_briefs      enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Workspace members can see workspace data
create policy "workspace_member_select" on workspaces for select
  using (id in (select workspace_id from profiles where id = auth.uid()));

-- Meetings: workspace members only
create policy "meetings_workspace" on meetings for all
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

-- Decisions: workspace members only
create policy "decisions_workspace" on decisions for all
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

-- Action items: workspace members only
create policy "action_items_workspace" on action_items for all
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

-- Meeting health: workspace members only
create policy "meeting_health_workspace" on meeting_health for all
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

-- Meeting series: workspace members only
create policy "meeting_series_workspace" on meeting_series for all
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

-- Meeting briefs: workspace members only
create policy "meeting_briefs_workspace" on meeting_briefs for all
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

-- Integrations: own only
create policy "integrations_own" on integrations for all
  using (user_id = auth.uid());

-- Meeting participants: workspace members only
create policy "meeting_participants_workspace" on meeting_participants for all
  using (meeting_id in (select id from meetings where workspace_id in (
    select workspace_id from profiles where id = auth.uid()
  )));

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at on action_items
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger action_items_updated_at
  before update on action_items
  for each row execute procedure set_updated_at();

create trigger integrations_updated_at
  before update on integrations
  for each row execute procedure set_updated_at();
