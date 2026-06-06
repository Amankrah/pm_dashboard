"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { McGillMark } from "@/components/brand/Brand";
import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { periodLabel } from "@/lib/analytics/periods";

const NAV = [
  {
    section: "Monitoring",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/activities", label: "Activity Map" },
    ],
  },
  {
    section: "Breakdown",
    items: [
      { href: "/dashboard/faculty", label: "By Faculty" },
      { href: "/dashboard/pillars", label: "By Pillar" },
      { href: "/dashboard/partners", label: "By Partner" },
      { href: "/dashboard/synergies", label: "Synergies" },
    ],
  },
  {
    section: "Planning & Reports",
    items: [
      { href: "/dashboard/targets", label: "Targets" },
      { href: "/dashboard/compare", label: "Compare Periods" },
      { href: "/dashboard/reports", label: "Reports" },
    ],
  },
  {
    section: "Data",
    items: [
      { href: "/dashboard/campaigns", label: "Campaigns & Links" },
      { href: "/dashboard/submissions", label: "Submissions" },
      { href: "/dashboard/settings", label: "Account & system" },
    ],
  },
];

export function DashboardShell({
  email,
  role,
  children,
}: {
  email: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { period, setPeriod, data, loading, filteredActivities } = useAnalytics();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[238px] flex-col overflow-y-auto bg-gradient-to-b from-[#152c47] to-[#1e3a5f] text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <McGillMark variant="dark" height={28} />
          <div className="mt-3 text-sm font-extrabold leading-tight">
            Nkabom Collaborative
          </div>
          <div className="text-[10px] tracking-wide text-white/55">
            Academic Lead Dashboard
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-5 pb-1 pt-3 text-[9.5px] font-bold uppercase tracking-widest text-white/35">
                {group.section}
              </p>
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block border-l-[3px] px-5 py-2 text-[12.5px] font-semibold transition-colors ${
                      active
                        ? "border-[#60a5fa] bg-[#2563a8]/30 text-white"
                        : "border-transparent text-white/70 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-[10px] leading-relaxed text-white/35">
          McGill University
          <br />
          Academic Lead Office
        </div>
      </aside>

      <div className="ml-[238px] flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#60a5fa] bg-[#1e3a5f] px-6 text-white">
          <span className="text-sm font-bold whitespace-nowrap">Faculty Activity Map</span>
          <div className="flex items-center gap-2">
            <label
              htmlFor="dashboard-period-select"
              className="text-[11px] text-white/60"
            >
              Period:
            </label>
            <select
              id="dashboard-period-select"
              name="period"
              aria-label="Reporting period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-xs text-white"
              disabled={loading}
            >
              {(data?.periodOptions ?? [{ value: "all", label: "All Time" }]).map((o) => (
                <option key={o.value} value={o.value} className="text-slate-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5">
              {data?.counts.submissions ?? 0} submissions
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5">
              {filteredActivities.length} activities
              {period !== "all" ? ` · ${periodLabel(period)}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden text-white/70 sm:inline">{email}</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-white/30 px-3 py-1 text-xs font-semibold hover:bg-white/10"
            >
              Print
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-white/30 px-3 py-1 text-xs font-semibold hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 bg-[#edf1f7] p-6 print:bg-white">
          {loading && !data ? (
            <p className="text-sm text-slate-500">Loading analytics…</p>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
