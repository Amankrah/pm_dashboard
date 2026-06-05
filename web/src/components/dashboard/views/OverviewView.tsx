"use client";

import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { FACULTIES, FAC_SHORT, PILLAR_META, PILLARS } from "@/lib/constants";
import { countByStatus, getTarget, pillarStats } from "@/lib/analytics/metrics-core";

export function OverviewView() {
  const { filteredActivities, filteredSubmissions, data, period } = useAnalytics();
  const acts = filteredActivities;
  const stats = countByStatus(acts);
  const partners = new Set(acts.map((a) => a.partnerInstitution).filter(Boolean)).size;
  const targets = data?.targets ?? { overall: {}, annual: {}, quarterly: {} };

  return (
    <div className="space-y-5">
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Faculty Submissions", value: filteredSubmissions.length, sub: `of ${FACULTIES.length} faculties`, border: "#1e5fa8" },
          { label: "Activities Completed", value: stats.completed, sub: `of ${stats.total} total`, border: "#15803d" },
          { label: "Activities Ongoing", value: stats.ongoing, sub: "in progress", border: "#a05c00" },
          { label: "Partners Engaged", value: partners, sub: "Ghanaian institutions", border: "#1e3a5f" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-[10px] border-t-4 bg-white p-5 shadow-sm"
            style={{ borderTopColor: c.border }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[10px] bg-white p-5 shadow-sm">
        <h4 className="text-sm font-bold text-[#1e3a5f]">Overall Project Progress</h4>
        {[
          { label: "Completed", n: stats.completed, color: "#15803d" },
          { label: "Ongoing", n: stats.ongoing, color: "#a05c00" },
          { label: "Planned", n: stats.planned, color: "#1e3a5f" },
        ].map((row) => {
          const pct = stats.total > 0 ? Math.round((row.n / stats.total) * 100) : 0;
          return (
            <div key={row.label} className="mt-2.5 flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-semibold" style={{ color: row.color }}>
                {row.label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: row.color }} />
              </div>
              <span className="w-9 text-right text-xs font-bold" style={{ color: row.color }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#1e3a5f]">Progress by Strategic Pillar</h3>
        <p className="text-[11px] text-slate-500">Activities mapped to each pillar</p>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3">
        {PILLARS.map((key) => {
          const m = PILLAR_META[key];
          const { done, going, plan, tot, pct } = pillarStats(acts, key);
          const tgt = getTarget(targets, key, period);
          const tgtPct = tgt > 0 ? Math.min(100, Math.round((done / tgt) * 100)) : pct;
          const barW = tgt > 0 ? tgtPct : pct;
          return (
            <div
              key={key}
              className="rounded-[10px] border-t-4 bg-white p-5 shadow-sm"
              style={{ borderTopColor: m.color }}
            >
              <p className="text-sm font-extrabold" style={{ color: m.color }}>
                {key}
              </p>
              <p className="mb-2 text-[11px] text-slate-500">{m.short}</p>
              <div className="mb-3 flex gap-3">
                <div className="text-center"><div className="text-xl font-extrabold text-[#15803d]">{done}</div><div className="text-[9.5px] uppercase text-slate-500">Done</div></div>
                <div className="text-center"><div className="text-xl font-extrabold text-[#a05c00]">{going}</div><div className="text-[9.5px] uppercase text-slate-500">Active</div></div>
                <div className="text-center"><div className="text-xl font-extrabold text-[#1e3a5f]">{plan}</div><div className="text-[9.5px] uppercase text-slate-500">Planned</div></div>
              </div>
              <div className="relative h-2 overflow-hidden rounded bg-slate-100">
                <div className="h-full rounded transition-all" style={{ width: `${barW}%`, background: m.color }} />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {tgt > 0 ? `${done}/${tgt} target (${tgtPct}%)` : `${pct}% complete (${tot} activities)`}
              </p>
            </div>
          );
        })}
      </div>

      <OverviewCharts acts={acts} />

      <div>
        <h3 className="text-sm font-bold text-[#1e3a5f]">Faculty Engagement Tracker</h3>
        <p className="text-[11px] text-slate-500">Submission status by faculty</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FACULTIES.map((f) => {
          const subs = filteredSubmissions.filter((s) => s.faculty === f);
          const actCount = subs.reduce((n, s) => n + s.activities.length, 0);
          const submitted = subs.length > 0;
          return (
            <div
              key={f}
              className={`rounded-[10px] border-l-4 bg-white p-4 shadow-sm ${submitted ? "border-l-[#2563a8]" : "border-l-slate-200"}`}
            >
              <p className="text-xs font-bold">{FAC_SHORT[f] || f}</p>
              <p className={`text-[11px] ${submitted ? "font-semibold text-[#1a6b44]" : "text-slate-500"}`}>
                {submitted ? "Submitted" : "Pending"}
              </p>
              <p className="mt-1.5 text-xl font-extrabold text-[#1e3a5f]">{actCount}</p>
              <p className="text-[10px] text-slate-500">activities</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
