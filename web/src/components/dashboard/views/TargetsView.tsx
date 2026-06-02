"use client";

import { useState } from "react";
import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { ThemeTag } from "@/components/dashboard/ThemeTag";
import { PILLARS, PILLAR_META } from "@/lib/constants";
import { pillarStats } from "@/lib/analytics/metrics-core";
import {
  filterByPeriod,
  parsePeriod,
  getActDate,
  periodLabel,
} from "@/lib/analytics/periods";
import type { TargetsMap } from "@/lib/analytics/metrics-core";
import type { FlatActivity } from "@/lib/analytics/types";

function deriveTargetValues(
  activeTab: string,
  targets: TargetsMap,
): Record<string, number> {
  let obj: Record<string, number> = {};
  if (activeTab === "overall") obj = { ...targets.overall };
  else if (/^\d{4}$/.test(activeTab)) obj = { ...(targets.annual[activeTab] ?? {}) };
  else if (/^\d{4}-Q\d$/.test(activeTab)) obj = { ...(targets.quarterly[activeTab] ?? {}) };

  const next: Record<string, number> = {};
  PILLARS.forEach((p) => {
    next[p] = obj[p] ?? 0;
  });
  return next;
}

function TargetPeriodEditor({
  activeTab,
  targets,
  acts,
  label,
  onSaved,
}: {
  activeTab: string;
  targets: TargetsMap;
  acts: FlatActivity[];
  label: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(() => deriveTargetValues(activeTab, targets));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const acts2 = filterByPeriod(acts, activeTab === "overall" ? "all" : activeTab);

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodKey: activeTab, values }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Targets saved.");
      onSaved();
    } else {
      setMsg("Save failed (admin only).");
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
      <div className="flex items-center justify-between bg-[#1e3a5f] px-5 py-3 text-sm font-bold text-white">
        <span>Activity completion targets — {label}</span>
      </div>
      <div className="space-y-4 p-5">
        {PILLARS.map((key) => {
          const m = PILLAR_META[key];
          const { done, tot } = pillarStats(acts2, key);
          const tgt = values[key] ?? 0;
          const pct = tgt > 0 ? Math.min(100, Math.round((done / tgt) * 100)) : 0;
          return (
            <div
              key={key}
              className="grid items-center gap-3 border-b border-slate-100 pb-4 last:border-0 sm:grid-cols-[1fr_100px_60px_60px_1fr]"
            >
              <ThemeTag theme={`${m.icon} ${key}`} />
              <div>
                <label
                  htmlFor={`target-${activeTab}-${key}`}
                  className="text-[10px] font-bold uppercase text-slate-500"
                >
                  Target
                </label>
                <input
                  id={`target-${activeTab}-${key}`}
                  type="number"
                  min={0}
                  max={999}
                  aria-label={`${key} target for ${label}`}
                  value={values[key] ?? 0}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: Number(e.target.value) }))
                  }
                  className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-center text-sm"
                />
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold text-[#15803d]">{done}</div>
                <div className="text-[10px] text-slate-500">done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold text-[#1e3a5f]">{tot}</div>
                <div className="text-[10px] text-slate-500">total</div>
              </div>
              <div className="flex items-center gap-2">
                {tgt > 0 ? (
                  <>
                    <div className="h-4 flex-1 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="h-full rounded-lg"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 100 ? "#15803d" : pct >= 70 ? "#a05c00" : "#2563a8",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold">
                      {done}/{tgt} ({pct}%)
                    </span>
                  </>
                ) : (
                  <span className="text-xs italic text-slate-500">Set a target to track</span>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex justify-end gap-2">
          {msg && <span className="self-center text-sm text-slate-600">{msg}</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Save targets for {label}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TargetsView() {
  const { data, refresh } = useAnalytics();
  const acts = data?.activities ?? [];
  const [activeTab, setActiveTab] = useState("overall");

  const years = new Set<string>();
  const quarters = new Set<string>();
  acts.forEach((a) => {
    const p = parsePeriod(getActDate(a));
    if (p) {
      years.add(p.yearStr);
      quarters.add(p.quarterStr);
    }
  });
  years.add(String(new Date().getFullYear()));

  const tabs = [{ key: "overall", label: "Overall" }];
  [...years].sort().forEach((y) => {
    tabs.push({ key: y, label: y });
    (["Q1", "Q2", "Q3", "Q4"] as const).forEach((q) => {
      const qs = `${y}-${q}`;
      if (quarters.has(qs)) tabs.push({ key: qs, label: `${q} ${y}` });
    });
  });

  const label = activeTab === "overall" ? "Overall" : periodLabel(activeTab);
  const targets = data?.targets;

  return (
    <div className="space-y-5">
      <div className="flex gap-4 rounded-[10px] bg-white p-5 shadow-sm">
        <span className="text-4xl">📈</span>
        <div>
          <h3 className="font-extrabold text-[#1e3a5f]">Target setting & progress</h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Set completed-activity targets per pillar. Progress bars on Overview use the global
            period filter; targets here use the tab period.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`rounded-full border-2 px-4 py-1.5 text-xs font-semibold ${
              activeTab === t.key
                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#2563a8]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {targets ? (
        <TargetPeriodEditor
          key={activeTab}
          activeTab={activeTab}
          targets={targets}
          acts={acts}
          label={label}
          onSaved={refresh}
        />
      ) : (
        <p className="rounded-[10px] bg-white py-8 text-center text-sm text-slate-500 shadow-sm">
          Loading targets…
        </p>
      )}
    </div>
  );
}
