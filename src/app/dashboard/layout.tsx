import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, workspace_id, workspaces(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold tracking-tight text-white">Meridian</p>
          {/* @ts-expect-error supabase join type */}
          <p className="text-xs text-white/35 mt-0.5 truncate">{profile?.workspaces?.name ?? "Workspace"}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem href="/dashboard" label="Dashboard" icon={<GridIcon />} />
          <NavItem href="/dashboard/meetings" label="Meetings" icon={<VideoIcon />} />
          <NavItem href="/dashboard/decisions" label="Decisions" icon={<ListIcon />} />
          <NavItem href="/dashboard/settings" label="Settings" icon={<GearIcon />} />
        </nav>

        <div className="px-3 pb-5 border-t border-white/[0.06] pt-3">
          <p className="px-2 text-xs text-white/35 mb-2 truncate">{profile?.full_name ?? user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-2 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
    >
      <span className="shrink-0 opacity-70">{icon}</span>
      {label}
    </Link>
  );
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="3" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 5.5L14 3.5V11.5L10 9.5V5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4H13M2 7.5H13M2 11H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.5 1.5V3M7.5 12V13.5M1.5 7.5H3M12 7.5H13.5M3.2 3.2L4.3 4.3M10.7 10.7L11.8 11.8M3.2 11.8L4.3 10.7M10.7 4.3L11.8 3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
