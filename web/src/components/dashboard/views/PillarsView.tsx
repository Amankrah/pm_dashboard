"use client";

import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { StatusDot } from "@/components/dashboard/ThemeTag";
import { FAC_SHORT, PILLAR_META, PILLARS } from "@/lib/constants";
import { getTarget, pillarStats } from "@/lib/analytics/metrics-core";
import { periodLabel } from "@/lib/analytics/periods";

export function PillarsView() {
  const { filteredActivities, data, period } = useAnalytics();
  const targets = data?.targets ?? { overall: {}, annual: {}, quarterly: {} };

  return (
    <div className="space-y-5">
      <p className="text-[11px] text-slate-500">
        {filteredActivities.length} activities
        {period !== "all" ? ` · ${periodLabel(period)}` : ""}
      </p>
      {PILLARS.map((key) => {
        const m = PILLAR_META[key];
        const { pa, done, going, plan, tot, pct } = pillarStats(filteredActivities, key);
        const tgt = getTarget(targets, key, period);
        const tgtPct = tgt > 0 ? Math.min(100, Math.round((done / tgt) * 100)) : 0;
        const partnerSet = new Set(pa.map((a) => a.partnerInstitution).filter(Boolean));
        const facSet = new Set(pa.map((a) => FAC_SHORT[a.submission.faculty] || a.submission.faculty));

        const headerGrad =
          m.cls === "edu"
            ? "from-[#1a4a8a] to-[#1e5fa8]"
            : m.cls === "acc"
              ? "from-[#0f4a2c] to-[#1a6b44]"
              : m.cls === "ent"
                ? "from-[#7a4300] to-[#a05c00]"
                : "from-[#3f157f] to-[#5b21b6]";

        return (
          <div key={key} className="overflow-hidden rounded-[10px] bg-white shadow-sm">
            <div className={`flex items-center justify-between bg-gradient-to-br ${headerGrad} px-5 py-4 text-white`}>
              <div>
                <p className="text-base font-extrabold">{key}</p>
                <p className="mt-0.5 text-xs opacity-75">{m.desc.slice(0, 80)}…</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold leading-none">{tot}</p>
                <p className="text-[11px] opacity-75">activities</p>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4 grid grid-cols-4 gap-3">
                {[
                  [done, "Completed", "#15803d"],
                  [going, "Ongoing", "#a05c00"],
                  [plan, "Planned", "#1e3a5f"],
                  [partnerSet.size, "Partners", "#2563a8"],
                ].map(([n, l, c]) => (
                  <div key={l as string} className="rounded-lg bg-slate-50 p-3 text-center">
                    <div className="text-xl font-extrabold" style={{ color: c as string }}>{n as number}</div>
                    <div className="text-[10px] uppercase text-slate-500">{l as string}</div>
                  </div>
                ))}
              </div>
              {tgt > 0 && (
                <div className="mb-3 flex items-center gap-2 text-xs">
                  <span className="w-28 font-semibold text-slate-700">vs. Target ({tgt})</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className="h-full rounded-lg"
                      style={{
                        width: `${tgtPct}%`,
                        background: tgtPct >= 100 ? "#15803d" : tgtPct >= 70 ? "#a05c00" : "#2563a8",
                      }}
                    />
                  </div>
                  <span className="w-20 text-right font-bold">{done}/{tgt} ({tgtPct}%)</span>
                </div>
              )}
              <div className="mb-3 flex items-center gap-2 text-xs">
                <span className="w-28 font-semibold text-slate-700">Completion</span>
                <div className="h-4 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div className="h-full rounded-lg bg-[#1a6b44]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-20 text-right font-bold text-[#1a6b44]">{pct}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Faculties:</strong> {[...facSet].join(", ") || "None"}
              </p>
              <p className="mb-3 text-[11px] text-slate-500">
                <strong>Partners:</strong> {[...partnerSet].join("; ") || "None"}
              </p>
              {tot > 0 ? (
                <div className="space-y-2">
                  {pa.map((a) => (
                    <div key={a.id} className="flex gap-2 border-b border-slate-100 py-2 last:border-0">
                      <StatusDot status={a.status} />
                      <div>
                        <p className="text-xs font-semibold">{a.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {FAC_SHORT[a.submission.faculty]} · {a.submission.fullName}
                          {a.partnerInstitution ? ` · ${a.partnerInstitution}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-500">No activities in this period.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
