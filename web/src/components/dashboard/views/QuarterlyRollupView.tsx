"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PILLAR_META } from "@/lib/constants";
import {
  buildIndicatorRollup,
  buildPillarActivityRollup,
  type IndicatorKey,
  type IndicatorTargetLookup,
  type RollupRow,
} from "@/lib/analytics/indicator-rollup";
import type { FlatActivity } from "@/lib/analytics/types";

// Targets keyed by programYear so the same fetch cache survives flipping
// between quarters within a year. Lives outside React state so the
// snapshot version (a monotonic counter) plays nicely with
// useSyncExternalStore: getSnapshot returns the same value between
// updates, the subscribe callback fires on every change.
const targetsCache = new Map<number, IndicatorTargetLookup>();
const inflight = new Set<number>();
const targetsListeners = new Set<() => void>();
let targetsVersion = 0;

function notifyTargetsChanged() {
  targetsVersion += 1;
  for (const cb of targetsListeners) cb();
}

function subscribeTargets(callback: () => void) {
  targetsListeners.add(callback);
  return () => {
    targetsListeners.delete(callback);
  };
}

function getTargetsVersion(): number {
  return targetsVersion;
}

// SSR returns 0; client picks up the same starting value so hydration
// matches.
function getServerTargetsVersion(): number {
  return 0;
}

async function ensureTargetsLoaded(programYear: number) {
  if (targetsCache.has(programYear) || inflight.has(programYear)) return;
  inflight.add(programYear);
  try {
    const res = await fetch(
      `/api/indicator-targets?programYear=${programYear}`,
    );
    if (!res.ok) {
      targetsCache.set(programYear, {});
    } else {
      const data = (await res.json()) as { targets?: IndicatorTargetLookup };
      targetsCache.set(programYear, data.targets ?? {});
    }
    notifyTargetsChanged();
  } catch {
    targetsCache.set(programYear, {});
    notifyTargetsChanged();
  } finally {
    inflight.delete(programYear);
  }
}

type Period = {
  id: string;
  label: string;
  reportKey: string;
  programYear: number;
  quarter: number;
};

export function QuarterlyRollupView({
  activities,
  periods,
}: {
  activities: FlatActivity[];
  periods: Period[];
}) {
  const [reportKey, setReportKey] = useState<string>(
    periods[0]?.reportKey ?? "",
  );

  const selected = useMemo(
    () => periods.find((p) => p.reportKey === reportKey) ?? null,
    [periods, reportKey],
  );

  // Subscribe to the targets cache. The version bumps whenever a fetch
  // resolves for any programYear, triggering a re-render so the rollup
  // picks up the new Annual Target numbers.
  useSyncExternalStore(
    subscribeTargets,
    getTargetsVersion,
    getServerTargetsVersion,
  );

  // Kick off the fetch when the selected period's programYear changes.
  // ensureTargetsLoaded is a no-op for already-cached or in-flight years.
  useEffect(() => {
    if (selected) {
      void ensureTargetsLoaded(selected.programYear);
    }
  }, [selected]);

  const targets: IndicatorTargetLookup = selected
    ? (targetsCache.get(selected.programYear) ?? {})
    : {};

  const rollup = useMemo(() => {
    if (!selected) return null;
    return buildIndicatorRollup(
      activities,
      {
        reportKey: selected.reportKey,
        programYear: selected.programYear,
        quarter: selected.quarter,
      },
      targets,
    );
  }, [activities, selected, targets]);

  const pillarRollup = useMemo(() => {
    if (!selected) return null;
    return buildPillarActivityRollup(activities, {
      reportKey: selected.reportKey,
      programYear: selected.programYear,
      quarter: selected.quarter,
    });
  }, [activities, selected]);

  if (periods.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-base font-semibold text-[#1e3a5f]">
          No quarterly reporting periods yet
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Create a reporting period (with a program year and quarter) under{" "}
          <a
            href="/dashboard/campaigns"
            className="font-semibold text-[#2563a8] hover:underline"
          >
            Campaigns and Links
          </a>{" "}
          to see the rollup here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f]">Quarterly rollup</h1>
        <p className="mt-1 text-sm text-slate-600">
          Aggregates faculty submissions into the shape of the Mastercard
          Foundation Partner Narrative Report&apos;s Overall Indicator
          Performance and Programme Achievements tables. Numbers are computed
          live from the database; pick a quarter to scope the view.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
        <label
          htmlFor="quarterly-period"
          className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
        >
          Reporting period
        </label>
        <select
          id="quarterly-period"
          value={reportKey}
          onChange={(e) => setReportKey(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {periods.map((p) => (
            <option key={p.reportKey} value={p.reportKey}>
              {p.reportKey} · {p.label}
            </option>
          ))}
        </select>
        {selected && rollup && (
          <div className="ml-auto flex flex-wrap gap-2 text-xs">
            <Stat
              label="Previous Qtr"
              value={rollup.previousKey ?? "—"}
              mono
            />
            <Stat label="Current Qtr" value={selected.reportKey} mono />
            <Stat label="Activities (current)" value={String(rollup.currentCount)} />
            <Stat
              label="Activities (cumulative)"
              value={String(rollup.cumulativeCount)}
            />
          </div>
        )}
      </div>

      {selected && rollup && (
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-bold text-[#1e3a5f]">
              Overall Indicator Performance
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Section 1.2 of the report. Sums treat unreported activity counts
              as zero. &quot;Annual Target&quot; will populate once per-indicator
              targets are configured (Phase 6).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Indicator</th>
                  <th className="px-4 py-2.5 text-right">Annual Target</th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">
                    Previous Qtr
                  </th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">
                    Current Qtr
                  </th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">
                    Cumulative (Year)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rollup.rows.map((row) => (
                  <IndicatorTableRow key={row.key} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && pillarRollup && (
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-bold text-[#1e3a5f]">
              Activity count by pillar
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Per-pillar volume across Previous, Current, and Cumulative
              windows. Feeds Section 1.3 (Programme Achievements by Pillar).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Pillar</th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">
                    Previous Qtr
                  </th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">
                    Current Qtr
                  </th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">
                    Cumulative (Year)
                  </th>
                </tr>
              </thead>
              <tbody>
                {pillarRollup.map((row) => (
                  <tr key={row.pillar} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white ${PILLAR_META[row.pillar as keyof typeof PILLAR_META]?.bgClass ?? "bg-slate-500"}`}
                        aria-hidden="true"
                      >
                        {PILLAR_META[row.pillar as keyof typeof PILLAR_META]?.abbr ?? "?"}
                      </span>
                      <span className="ml-2 font-semibold text-[#1e3a5f]">
                        {row.pillar}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {row.previousQtr.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-[#1e3a5f]">
                      {row.currentQtr.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {row.cumulativeYtd.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function IndicatorTableRow({ row }: { row: RollupRow }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className={`px-4 py-2.5 ${row.indent ? "pl-10 text-slate-700" : "font-semibold text-[#1e3a5f]"}`}>
        {row.label}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">
        {row.annualTarget === null ? "—" : row.annualTarget.toLocaleString()}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
        {row.previousQtr.toLocaleString()}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-[#1e3a5f]">
        {row.currentQtr.toLocaleString()}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
        {row.cumulativeYtd.toLocaleString()}
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span
        className={`text-xs font-semibold text-[#1e3a5f] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </span>
  );
}
