"use client";

import { useMemo, useState } from "react";
import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { filterByPeriod, periodLabel } from "@/lib/analytics/periods";
import { countByStatus } from "@/lib/analytics/metrics-core";

function periodMetrics(acts: ReturnType<typeof filterByPeriod>) {
  const s = countByStatus(acts);
  return {
    total: s.total,
    done: s.completed,
    go: s.ongoing,
    plan: s.planned,
    completed: s.completed,
    ongoing: s.ongoing,
    planned: s.planned,
    partners: new Set(acts.map((a) => a.partnerInstitution).filter(Boolean)).size,
    eduN: acts.filter((a) => a.themes.includes("Education")).length,
    accN: acts.filter((a) => a.themes.includes("Access and Success")).length,
    entN: acts.filter((a) => a.themes.includes("Entrepreneurship")).length,
  };
}

function Delta({ a, b }: { a: number; b: number }) {
  const d = b - a;
  const cls =
    d > 0 ? "bg-green-100 text-green-800" : d < 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500";
  const arrow = d > 0 ? "▲ +" : d < 0 ? "▼ " : "= ";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {arrow}
      {d}
    </span>
  );
}

export function CompareView() {
  const { data } = useAnalytics();
  const options = data?.periodOptions.filter((o) => o.value !== "all") ?? [];
  const [periodA, setPeriodA] = useState("");
  const [periodB, setPeriodB] = useState("");

  const comparison = useMemo(() => {
    if (!periodA || !periodB || !data) return null;
    const acts = data.activities;
    const mA = periodMetrics(filterByPeriod(acts, periodA));
    const mB = periodMetrics(filterByPeriod(acts, periodB));
    return { mA, mB, labelA: periodLabel(periodA), labelB: periodLabel(periodB) };
  }, [periodA, periodB, data]);

  const rows = comparison
    ? [
        ["Total Activities", comparison.mA.total, comparison.mB.total],
        ["Completed", comparison.mA.done, comparison.mB.done],
        ["Ongoing", comparison.mA.go, comparison.mB.go],
        ["Planned", comparison.mA.plan, comparison.mB.plan],
        ["Partners", comparison.mA.partners, comparison.mB.partners],
        ["Education", comparison.mA.eduN, comparison.mB.eduN],
        ["Access & Success", comparison.mA.accN, comparison.mB.accN],
        ["Entrepreneurship", comparison.mA.entN, comparison.mB.entN],
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-[10px] bg-white p-4 shadow-sm">
          <label
            htmlFor="compare-period-a"
            className="text-[11px] font-bold uppercase text-slate-500"
          >
            Period A
          </label>
          <select
            id="compare-period-a"
            name="periodA"
            aria-label="Period A"
            value={periodA}
            onChange={(e) => setPeriodA(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <p className="pb-2 text-center text-lg font-extrabold text-slate-500">VS</p>
        <div className="rounded-[10px] bg-white p-4 shadow-sm">
          <label
            htmlFor="compare-period-b"
            className="text-[11px] font-bold uppercase text-slate-500"
          >
            Period B
          </label>
          <select
            id="compare-period-b"
            name="periodB"
            aria-label="Period B"
            value={periodB}
            onChange={(e) => setPeriodB(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!comparison ? (
        <p className="rounded-[10px] bg-white py-12 text-center italic text-slate-500 shadow-sm">
          Select two periods above to compare.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {[comparison.mA, comparison.mB].map((m, i) => (
              <div key={i} className="overflow-hidden rounded-[10px] bg-white shadow-sm">
                <div className={`px-4 py-3 text-sm font-bold text-white ${i === 0 ? "bg-[#1e3a5f]" : "bg-[#2563a8]"}`}>
                  {i === 0 ? comparison.labelA : comparison.labelB}
                </div>
                <div className="space-y-0 p-4">
                  {[
                    ["Total", m.total],
                    ["Completed", m.done],
                    ["Ongoing", m.go],
                    ["Planned", m.plan],
                  ].map(([l, n]) => (
                    <div key={l as string} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                      <span className="font-semibold text-slate-700">{l as string}</span>
                      <span className="text-lg font-extrabold">{n as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#1e3a5f] text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-2">Metric</th>
                  <th className="px-4 py-2 text-center">{comparison.labelA}</th>
                  <th className="px-4 py-2 text-center">{comparison.labelB}</th>
                  <th className="px-4 py-2 text-center">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b]) => (
                  <tr key={label as string} className="border-b border-slate-100">
                    <td className="px-4 py-2 font-semibold">{label as string}</td>
                    <td className="px-4 py-2 text-center font-extrabold">{a as number}</td>
                    <td className="px-4 py-2 text-center font-extrabold">{b as number}</td>
                    <td className="px-4 py-2 text-center">
                      <Delta a={a as number} b={b as number} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
