"use client";

import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { ThemeTag } from "@/components/dashboard/ThemeTag";
import {
  FAC_FULL_NAMES,
  FAC_KEYS,
  FAC_MATCH,
  FAC_SHORT,
  PILLARS,
  initials,
} from "@/lib/constants";
import { openDeanReport } from "@/lib/analytics/dean-report";
import { filterByPeriod, periodLabel } from "@/lib/analytics/periods";

export function FacultyView() {
  const { filteredActivities, filteredSubmissions, data, period, loading } = useAnalytics();

  if (filteredSubmissions.length === 0) {
    return (
      <div className="rounded-[10px] bg-white p-12 text-center shadow-sm">
        <p className="text-4xl">🏛️</p>
        <h4 className="mt-3 font-bold text-[#1e3a5f]">No submissions yet</h4>
        <p className="mt-1 text-sm text-slate-500">Generate form links or import JSON submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[11px] text-slate-500">
        {FAC_KEYS.filter((fk) =>
          filteredActivities.some((a) => a.submission.faculty === FAC_MATCH[fk]),
        ).length}{" "}
        of 4 faculties with activities
        {period !== "all" ? ` · ${periodLabel(period)}` : ""}
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {FAC_KEYS.map((fk) => {
          const facKey = FAC_MATCH[fk];
          const facSubs = data?.submissions.filter((s) => s.faculty === facKey) ?? [];
          const facActs = filterByPeriod(
            facSubs.flatMap((s) => s.activities),
            period,
          );
          const done = facActs.filter((a) => a.status === "Completed").length;
          const go = facActs.filter((a) => a.status === "Ongoing").length;
          const plan = facActs.filter((a) => a.status === "Planned").length;
          const total = facActs.length;
          const compPct = total > 0 ? Math.round((done / total) * 100) : 0;
          const partners = new Set(facActs.map((a) => a.partnerInstitution).filter(Boolean));

          return (
            <div
              key={fk}
              className={`overflow-hidden rounded-[10px] bg-white shadow-sm ${total === 0 ? "opacity-60" : ""}`}
            >
              <div className="bg-gradient-to-br from-[#152c47] to-[#1e3a5f] p-4 text-white">
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-black">{fk}</p>
                    <p className="text-[11px] opacity-70">{FAC_FULL_NAMES[fk]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold leading-none">{total}</p>
                    <p className="text-[10px] opacity-65">activities</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] opacity-70">
                    <span>Completion</span><span>{compPct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/20">
                    <div className="h-full rounded bg-[#4ade80]" style={{ width: `${compPct}%` }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100">
                {[
                  [done, "Completed", "#15803d"],
                  [go, "Ongoing", "#a05c00"],
                  [plan, "Planned", "#1e3a5f"],
                  [partners.size, "Partners", "#2563a8"],
                ].map(([n, l, c]) => (
                  <div key={l as string} className="border-r border-slate-100 p-3 text-center last:border-r-0">
                    <div className="text-xl font-extrabold" style={{ color: c as string }}>{n as number}</div>
                    <div className="text-[10px] uppercase text-slate-500">{l as string}</div>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {PILLARS.map((p) => {
                    const n = facActs.filter((a) => a.themes.includes(p)).length;
                    return n > 0 ? (
                      <span key={p} className="inline-flex items-center gap-1">
                        <ThemeTag theme={p} />
                        <span className="text-[10px] text-slate-500">({n})</span>
                      </span>
                    ) : null;
                  })}
                </div>
                {facSubs.map((s) => {
                  const mActs = filterByPeriod(s.activities, period);
                  const mDone = mActs.filter((a) => a.status === "Completed").length;
                  return (
                    <div key={s.id} className="flex items-center gap-2.5 border-b border-slate-100 py-2 text-xs last:border-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563a8] text-[11px] font-extrabold text-white">
                        {initials(s.fullName)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{s.fullName}</div>
                        <div className="text-[11px] text-slate-500">{s.position}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-[#1e3a5f]">{mActs.length}</div>
                        <div className="text-[10px] text-slate-500">acts · {mDone} done</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!data) return;
                    openDeanReport(fk, data.submissions, data.activities, period);
                  }}
                  disabled={loading || !data}
                  className="w-full rounded-md bg-[#1e3a5f] py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Generate {fk} Dean Report
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
