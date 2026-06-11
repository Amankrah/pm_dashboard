"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NkabomMark } from "@/components/brand/Brand";
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
      { href: "/dashboard/output-indicators", label: "Output Indicators" },
      { href: "/dashboard/outcome-indicators", label: "Outcome Indicators" },
      { href: "/dashboard/program-adjustments", label: "Program Adjustments" },
      { href: "/dashboard/compare", label: "Compare Periods" },
      { href: "/dashboard/quarterly", label: "Quarterly Rollup" },
      { href: "/dashboard/reports/partner-narrative", label: "Partner Narrative" },
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

// Soft paper-grain overlay — keeps the dark navy from reading as flat plastic.
const PAPER_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.79  0 0 0 0 0.66  0 0 0 0 0.38  0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

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
      {/* ───── Sidebar — ink navy with gold-leaf hairlines ───── */}
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen w-[250px] flex-col overflow-y-auto text-[var(--cream)]"
        style={{
          background:
            "linear-gradient(180deg, #0b1623 0%, #0d1a2c 55%, #0a1320 100%)",
        }}
      >
        {/* paper grain overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: PAPER_NOISE, opacity: 0.6, mixBlendMode: "overlay" }}
        />
        {/* vertical gold hairline along the right edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(201,169,97,0) 6%, rgba(201,169,97,0.55) 40%, rgba(201,169,97,0.55) 60%, rgba(201,169,97,0) 94%, transparent 100%)",
          }}
        />

        {/* Brand block */}
        <div className="relative px-6 pt-6 pb-5">
          <div
            className="font-display text-[10px] uppercase tracking-luxe text-[var(--gold-soft)]"
            style={{ fontStyle: "italic" }}
          >
            Académie · Est. MMXXIV
          </div>
          <div className="mt-3">
            <NkabomMark variant="dark" height={34} />
          </div>
          <div className="mt-3 font-display text-[13px] italic leading-snug text-[var(--cream)]/75">
            Academic Lead Dashboard
          </div>
          {/* hairline rule */}
          <div
            aria-hidden
            className="mt-5 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(201,169,97,0.55) 30%, rgba(201,169,97,0.55) 70%, transparent)",
            }}
          />
        </div>

        <nav className="relative flex-1 pb-5">
          {NAV.map((group, gIdx) => (
            <div key={group.section} className="mt-3">
              <p
                className="font-display px-6 pb-2 pt-3 text-[11px] italic tracking-[0.32em] text-[var(--gold-soft)]/85"
                style={{ animation: `nav-fade-in 520ms ease both`, animationDelay: `${gIdx * 90}ms` }}
              >
                {group.section.toUpperCase()}
              </p>
              {group.items.map((item, iIdx) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-6 py-[7px] text-[13px] transition-all duration-200 ${
                      active
                        ? "text-[var(--cream)]"
                        : "text-[var(--cream)]/55 hover:text-[var(--cream)]/95"
                    }`}
                    style={{
                      animation: `nav-fade-in 520ms ease both`,
                      animationDelay: `${gIdx * 90 + iIdx * 30 + 40}ms`,
                    }}
                  >
                    {/* Active marker — antique gold square */}
                    <span
                      aria-hidden
                      className="inline-block transition-all duration-200"
                      style={{
                        width: active ? 6 : 3,
                        height: active ? 6 : 3,
                        background: active ? "var(--gold)" : "rgba(201,169,97,0.35)",
                        boxShadow: active ? "0 0 8px rgba(201,169,97,0.55)" : "none",
                        transform: "rotate(45deg)",
                      }}
                    />
                    <span
                      className={`font-medium ${active ? "tracking-[0.01em]" : ""}`}
                      style={{ fontFeatureSettings: '"ss01" 1' }}
                    >
                      {item.label}
                    </span>
                    {/* Hover gilt — only when not active */}
                    {!active && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-1/2 h-[18px] w-[2px] -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{ background: "linear-gradient(180deg, transparent, var(--gold) 50%, transparent)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer crest */}
        <div className="relative px-6 pb-6 pt-4">
          <div
            aria-hidden
            className="mb-4 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(201,169,97,0.4) 30%, rgba(201,169,97,0.4) 70%, transparent)",
            }}
          />
          <div className="font-display text-[12px] italic leading-[1.5] text-[var(--cream)]/55">
            McGill University
            <span className="text-[var(--gold-soft)]/70"> · </span>
            <span className="not-italic font-sans text-[10px] tracking-[0.18em] uppercase text-[var(--cream)]/40">
              Academic Lead Office
            </span>
          </div>
        </div>
      </aside>

      {/* ───── Main column ───── */}
      <div className="ml-[250px] flex min-h-screen flex-1 flex-col">
        {/* Header — ink with hairline gold rule */}
        <header
          className="sticky top-0 z-30 text-[var(--cream)]"
          style={{
            background:
              "linear-gradient(180deg, #0b1623 0%, #0e1c2f 100%)",
          }}
        >
          <div className="relative flex h-[68px] flex-wrap items-center justify-between gap-3 px-7">
            {/* paper grain overlay (subtle) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: PAPER_NOISE, opacity: 0.45, mixBlendMode: "overlay" }}
            />

            {/* Left: eyebrow + title in serif */}
            <div className="relative flex flex-col leading-none">
              <span className="font-display text-[10px] italic tracking-luxe text-[var(--gold-soft)]/90">
                FOLIO · {role.toUpperCase()}
              </span>
              <span className="font-display mt-1 text-[22px] italic leading-none text-[var(--cream)]">
                Faculty Activity Map
              </span>
            </div>

            {/* Center: period selector */}
            <div className="relative flex items-center gap-3">
              <label
                htmlFor="dashboard-period-select"
                className="font-display text-[12px] italic tracking-[0.18em] text-[var(--gold-soft)]/85"
              >
                Period
              </label>
              <div className="relative">
                <select
                  id="dashboard-period-select"
                  name="period"
                  aria-label="Reporting period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none rounded-none border-b border-[var(--gold)]/60 bg-transparent px-1 pr-6 py-1 text-[12px] text-[var(--cream)] outline-none transition-colors focus:border-[var(--gold)] disabled:opacity-50"
                  disabled={loading}
                  style={{ fontFeatureSettings: '"lnum" 1' }}
                >
                  {(data?.periodOptions ?? [{ value: "all", label: "All Time" }]).map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0b1623] text-[var(--cream)]">
                      {o.label}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-[var(--gold)]"
                >
                  ▾
                </span>
              </div>
            </div>

            {/* Counter pills */}
            <div className="relative flex gap-2 text-[11px]">
              <span
                className="rounded-full border border-[var(--gold)]/35 bg-[var(--gold)]/[0.04] px-3 py-[3px] text-[var(--cream)]/85"
                style={{ fontFeatureSettings: '"lnum" 1, "tnum" 1' }}
              >
                <span className="font-display italic text-[var(--gold-soft)]">
                  {data?.counts.submissions ?? 0}
                </span>{" "}
                submissions
              </span>
              <span
                className="rounded-full border border-[var(--gold)]/35 bg-[var(--gold)]/[0.04] px-3 py-[3px] text-[var(--cream)]/85"
                style={{ fontFeatureSettings: '"lnum" 1, "tnum" 1' }}
              >
                <span className="font-display italic text-[var(--gold-soft)]">
                  {filteredActivities.length}
                </span>{" "}
                activities
                {period !== "all" ? (
                  <span className="text-[var(--cream)]/55">
                    {" "}
                    · {periodLabel(period)}
                  </span>
                ) : null}
              </span>
            </div>

            {/* Right: identity + actions */}
            <div className="relative flex items-center gap-3 text-[12px]">
              <span className="hidden font-display italic text-[var(--cream)]/65 sm:inline">
                {email}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print rounded-none border border-[var(--gold)]/50 bg-transparent px-3 py-[5px] text-[11px] uppercase tracking-[0.22em] text-[var(--cream)]/85 transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--cream)]"
              >
                Print
              </button>
              <button
                type="button"
                onClick={logout}
                className="no-print rounded-none border border-[var(--gold)]/50 bg-transparent px-3 py-[5px] text-[11px] uppercase tracking-[0.22em] text-[var(--cream)]/85 transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--cream)]"
              >
                Sign out
              </button>
            </div>
          </div>
          {/* Hairline gold rule */}
          <div
            aria-hidden
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(201,169,97,0.65) 12%, rgba(201,169,97,0.65) 88%, transparent)",
            }}
          />
          {/* whisper-thin secondary rule */}
          <div
            aria-hidden
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,22,35,0.4), transparent)",
            }}
          />
        </header>

        <main
          className="relative flex-1 p-7 print:bg-white"
          style={{
            background:
              "radial-gradient(1100px 580px at 8% -10%, rgba(201,169,97,0.06), transparent 60%), radial-gradient(900px 540px at 110% 10%, rgba(30,58,95,0.05), transparent 60%), var(--parchment)",
          }}
        >
          {loading && !data ? (
            <p className="font-display text-[15px] italic text-[#1a2c47]/70">
              Composing the folio…
            </p>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
