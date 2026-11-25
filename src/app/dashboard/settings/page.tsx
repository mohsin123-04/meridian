export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { inviteTeammate, renameWorkspace } from "./actions";
import SlackChannelPicker from "./slack-channel-picker";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const profile = await getProfile();

  const supabase = await createClient();
  const { data: integrations } = await supabase
    .from("integrations")
    .select("provider, status, provider_user_id, updated_at, refresh_token")
    .eq("user_id", user.id);

  const google = integrations?.find((i) => i.provider === "google");
  const zoom = integrations?.find((i) => i.provider === "zoom");
  const slack = integrations?.find((i) => i.provider === "slack");
  const workspaceName = (profile?.workspaces as unknown as { id: string; name: string } | null)?.name ?? "";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Settings</h1>
      <p className="text-white/40 text-sm mb-8">Manage your workspace, integrations, and account.</p>

      {params.success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {params.success}
        </div>
      )}
      {params.error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {params.error}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">Workspace</h2>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
          <p className="text-sm font-medium mb-1">Workspace name</p>
          <p className="text-xs text-white/40 mb-4">Visible to all members in your workspace.</p>
          <form action={renameWorkspace} className="flex gap-2">
            <input
              name="name"
              type="text"
              defaultValue={workspaceName}
              placeholder="My Team"
              required
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
            <button
              type="submit"
              className="shrink-0 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">Team</h2>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
          <p className="text-sm font-medium mb-1">Invite a teammate</p>
          <p className="text-xs text-white/40 mb-4">They&apos;ll get an email and join your workspace automatically.</p>
          <form action={inviteTeammate} className="flex gap-2">
            <input
              name="email"
              type="email"
              placeholder="teammate@company.com"
              required
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
            <button
              type="submit"
              className="shrink-0 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Send invite
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">Integrations</h2>
        <div className="space-y-3">
          <IntegrationCard
            name="Google Meet"
            description="Automatically capture transcripts from Google Meet calls."
            icon={<GoogleIcon />}
            connected={!!google}
            connectedAs={google?.provider_user_id}
            connectHref="/api/integrations/google/connect"
            disconnectHref="/api/integrations/google/disconnect"
          />
          <IntegrationCard
            name="Zoom"
            description="Pull cloud recordings and transcripts from Zoom meetings."
            icon={<ZoomIcon />}
            connected={!!zoom}
            connectedAs={zoom?.provider_user_id}
            connectHref="/api/integrations/zoom/connect"
            disconnectHref="/api/integrations/zoom/disconnect"
          />

          {/* Slack */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <SlackIcon />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Slack</p>
                    {slack && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {slack
                      ? slack.provider_user_id
                      : "Post meeting summaries to a Slack channel automatically."}
                  </p>
                </div>
              </div>
              <a
                href={slack ? "/api/integrations/slack/disconnect" : "/api/integrations/slack/connect"}
                className={
                  slack
                    ? "shrink-0 text-xs text-white/35 hover:text-red-400 transition-colors"
                    : "shrink-0 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors"
                }
              >
                {slack ? "Disconnect" : "Connect"}
              </a>
            </div>

            {slack && (
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <p className="text-xs text-white/40 mb-2">Post summaries to</p>
                <SlackChannelPicker savedChannelId={slack.refresh_token ?? undefined} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  icon,
  connected,
  connectedAs,
  connectHref,
  disconnectHref,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  connectedAs?: string;
  connectHref: string;
  disconnectHref: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{name}</p>
            {connected && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Connected
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            {connected && connectedAs ? connectedAs : description}
          </p>
        </div>
      </div>

      <a
        href={connected ? disconnectHref : connectHref}
        className={
          connected
            ? "shrink-0 text-xs text-white/35 hover:text-red-400 transition-colors"
            : "shrink-0 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors"
        }
      >
        {connected ? "Disconnect" : "Connect"}
      </a>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#2D8CFF" />
      <path d="M4 8.5C4 7.67 4.67 7 5.5 7H13C13.83 7 14.5 7.67 14.5 8.5V15.5C14.5 16.33 13.83 17 13 17H5.5C4.67 17 4 16.33 4 15.5V8.5Z" fill="white" />
      <path d="M15.5 10.5L20 8V16L15.5 13.5V10.5Z" fill="white" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
      <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}
