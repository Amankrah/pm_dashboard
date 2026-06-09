"use client";

import { useEffect, useState } from "react";
import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { ThemeTag } from "@/components/dashboard/ThemeTag";
import { PILLARS } from "@/lib/constants";
import { pillarStats } from "@/lib/analytics/metrics-core";
import {
  filterByPeriod,
  parsePeriod,
  getActDate,
  periodLabel,
} from "@/lib/analytics/periods";
import {
  INDICATOR_ROWS,
  type IndicatorKey,
} from "@/lib/analytics/indicator-rollup";
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
        <span>Activity completion targets · {label}</span>
      </div>
      <div className="space-y-4 p-5">
        {PILLARS.map((key) => {
          const { done, tot } = pillarStats(acts2, key);
          const tgt = values[key] ?? 0;
          const pct = tgt > 0 ? Math.min(100, Math.round((done / tgt) * 100)) : 0;
          return (
            <div
              key={key}
              className="grid items-center gap-3 border-b border-slate-100 pb-4 last:border-0 sm:grid-cols-[1fr_100px_60px_60px_1fr]"
            >
              <ThemeTag theme={key} />
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
      <div className="rounded-[10px] border-l-4 border-l-[#2563a8] bg-white p-5 shadow-sm">
        <div>
          <h3 className="font-extrabold text-[#1e3a5f]">Target setting and progress</h3>
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

      <IndicatorTargetsEditor />
    </div>
  );
}

// Phase 6: per-indicator annual targets feeding the Partner Narrative
// Report's "Annual Target" column. One column of integer inputs per
// indicator (14 rows) for the currently selected programme year. Saving
// posts to /api/indicator-targets and the QuarterlyRollupView picks the
// new values up on next mount or year-switch (it caches per year).
const PROGRAM_YEARS = [1, 2, 3, 4, 5] as const;

function IndicatorTargetsEditor() {
  const [programYear, setProgramYear] = useState<number>(2);
  const [values, setValues] = useState<Record<IndicatorKey, string>>(
    () => Object.fromEntries(INDICATOR_ROWS.map((r) => [r.key, ""])) as Record<
      IndicatorKey,
      string
    >,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/indicator-targets?programYear=${programYear}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setMessage("Could not load existing targets.");
          setTone("error");
          return;
        }
        const data = (await res.json()) as {
          targets?: Partial<Record<IndicatorKey, number>>;
        };
        if (cancelled) return;
        const next = Object.fromEntries(
          INDICATOR_ROWS.map((r) => [
            r.key,
            data.targets?.[r.key] !== undefined
              ? String(data.targets?.[r.key])
              : "",
          ]),
        ) as Record<IndicatorKey, string>;
        setValues(next);
      } catch {
        if (!cancelled) {
          setMessage("Network error loading targets.");
          setTone("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [programYear]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        programYear,
        values: Object.fromEntries(
          INDICATOR_ROWS.map((r) => {
            const raw = values[r.key]?.trim();
            const n = raw ? Number(raw) : 0;
            return [r.key, Number.isFinite(n) && n >= 0 ? n : 0];
          }),
        ),
      };
      const res = await fetch("/api/indicator-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setMessage("Save failed. Admin access required.");
        setTone("error");
        return;
      }
      setMessage(`Saved targets for Y${programYear}.`);
      setTone("success");
    } catch {
      setMessage("Network error saving targets.");
      setTone("error");
    } finally {
      setSaving(false);
    }
  }

  const messageStyles =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "error"
        ? "bg-red-50 text-red-700 ring-red-200"
        : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1e3a5f]">
            Indicator annual targets
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            One integer per row of the Partner Narrative Report&apos;s Overall
            Indicator Performance table. Feeds the Annual Target column on the
            Quarterly Rollup page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="indicator-targets-year"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Program year
          </label>
          <select
            id="indicator-targets-year"
            value={programYear}
            onChange={(e) => setProgramYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#1e3a5f]"
          >
            {PROGRAM_YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Indicator</th>
              <th className="px-4 py-2.5 text-right">Annual target</th>
            </tr>
          </thead>
          <tbody>
            {INDICATOR_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 last:border-0">
                <td
                  className={`px-4 py-2 ${row.indent ? "pl-10 text-slate-700" : "font-semibold text-[#1e3a5f]"}`}
                >
                  <label htmlFor={`target-${row.key}`}>{row.label}</label>
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    id={`target-${row.key}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={values[row.key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [row.key]: e.target.value }))
                    }
                    placeholder="0"
                    disabled={loading}
                    className="w-32 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-3">
        {message && (
          <span
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ${messageStyles}`}
          >
            {message}
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : `Save Y${programYear} targets`}
        </button>
      </div>
    </section>
  );
}
