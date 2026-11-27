import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";
import SyncTrigger from "./sync-trigger";
import NavItems from "./nav-items";
import SearchBar from "./search-bar";
import NavProgress from "./nav-progress";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-[#09080f] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold tracking-tight text-white">Meridian</p>
          {/* @ts-expect-error supabase join type */}
          <p className="text-xs text-white/35 mt-0.5 truncate">{profile?.workspaces?.name ?? "Workspace"}</p>
        </div>

        <SearchBar />
        <NavItems />

        <div className="px-3 pb-5 border-t border-white/[0.06] pt-3">
          <p className="px-2 text-xs text-white/35 mb-2 truncate">{profile?.full_name ?? user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-2 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-[0.97] transition-all"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
      <SyncTrigger />
      <NavProgress />
    </div>
  );
}
