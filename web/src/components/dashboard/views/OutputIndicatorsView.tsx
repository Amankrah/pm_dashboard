"use client";

import { useEffect, useMemo, useState } from "react";
import { PILLARS, PILLAR_META, type Pillar } from "@/lib/constants";
import {
  OUTPUT_INDICATORS,
  outputIndicatorsByPillar,
  type OutputIndicatorMeta,
} from "@/lib/analytics/output-indicators";

type RemoteState = {
  targets: Record<string, number>;
  entries: Record<string, { value: number; comments: string | null }>;
  cumulative: Record<string, number>;
};

type LocalRow = {
  // We store strings to keep inputs controlled and distinguish blank ("not
  // reported") from "0" ("explicitly zero").
  target: string;
  value: string;
  comments: string;
};

function rowKey(pillar: string, indicator: string) {
  return `${pillar}::${indicator}`;
}

function unitSuffix(meta: OutputIndicatorMeta) {
  if (meta.unit === "percent") return "%";
  if (meta.unit === "currency") return "$";
  return "";
}

function formatNumber(n: number, unit: OutputIndicatorMeta["unit"]) {
  if (unit === "currency") {
    return `$${n.toLocaleString()}`;
  }
  if (unit === "percent") {
    return `${n}%`;
  }
  return n.toLocaleString();
}

export function OutputIndicatorsView({ isAdmin }: { isAdmin: boolean }) {
  const [programYear, setProgramYear] = useState(2);
  const [quarter, setQuarter] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "success" | "error">("info");
  const [rows, setRows] = useState<Record<string, LocalRow>>(() =>
    Object.fromEntries(
      OUTPUT_INDICATORS.map((m) => [
        rowKey(m.pillar, m.key),
        { target: "", value: "", comments: "" },
      ]),
    ),
  );
  const [remote, setRemote] = useState<RemoteState | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/output-indicators?programYear=${programYear}&quarter=${quarter}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setMessage("Could not load output indicators.");
          setTone("error");
          return;
        }
        const data = (await res.json()) as RemoteState;
        if (cancelled) return;
        setRemote(data);
        const next: Record<string, LocalRow> = {};
        for (const m of OUTPUT_INDICATORS) {
          const key = rowKey(m.pillar, m.key);
          next[key] = {
            target:
              data.targets[key] !== undefined ? String(data.targets[key]) : "",
            value:
              data.entries[key]?.value !== undefined
                ? String(data.entries[key]!.value)
                : "",
            comments: data.entries[key]?.comments ?? "",
          };
        }
        setRows(next);
      } catch {
        if (!cancelled) {
          setMessage("Network error loading output indicators.");
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
  }, [programYear, quarter]);

  const groupsByPillar = useMemo(
    () => PILLARS.map((p) => ({ pillar: p, groups: outputIndicatorsByPillar(p) })),
    [],
  );

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const targets = OUTPUT_INDICATORS.map((m) => {
        const key = rowKey(m.pillar, m.key);
        const raw = rows[key]?.target.trim();
        const n = raw ? Number(raw) : 0;
        return {
          pillar: m.pillar,
          indicator: m.key,
          target: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0,
        };
      });
      const entries = OUTPUT_INDICATORS.map((m) => {
        const key = rowKey(m.pillar, m.key);
        const raw = rows[key]?.value.trim();
        const n = raw ? Number(raw) : 0;
        return {
          pillar: m.pillar,
          indicator: m.key,
          value: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0,
          comments: rows[key]?.comments.trim() || null,
        };
      });
      const res = await fetch("/api/output-indicators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programYear, quarter, targets, entries }),
      });
      if (!res.ok) {
        setMessage("Save failed. Admin access required.");
        setTone("error");
        return;
      }
      const data = (await res.json()) as RemoteState;
      setRemote(data);
      setMessage(`Saved Y${programYear}Q${quarter}.`);
      setTone("success");
    } catch {
      setMessage("Network error saving output indicators.");
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
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f]">Output indicators</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin-entered values for the Partner Narrative Report&apos;s Output
          Level Progress section. Targets are set once per programme year;
          achieved values are entered per quarter. Cumulative YTD sums every
          quarter saved so far for the selected year.
          {!isAdmin && (
            <span className="ml-1 italic">
              Read-only — admin role required to save.
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Program year
          <select
            value={programYear}
            onChange={(e) => setProgramYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#1e3a5f]"
          >
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Quarter
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#1e3a5f]"
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Q{q}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-2 rounded-md bg-[#1e3a5f] px-2 py-0.5 font-mono text-[11.5px] font-semibold text-white">
          Y{programYear}Q{quarter}
        </span>
        {loading && (
          <span className="text-xs text-slate-500">Loading…</span>
        )}
        {message && (
          <span
            className={`ml-auto rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ${messageStyles}`}
          >
            {message}
          </span>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="ml-2 rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {groupsByPillar.map(({ pillar, groups }) => (
        <PillarBlock
          key={pillar}
          pillar={pillar}
          groups={groups}
          rows={rows}
          remote={remote}
          loading={loading}
          isAdmin={isAdmin}
          onChange={(key, field, val) =>
            setRows((prev) => ({
              ...prev,
              [key]: { ...prev[key]!, [field]: val },
            }))
          }
        />
      ))}
    </div>
  );
}

function PillarBlock({
  pillar,
  groups,
  rows,
  remote,
  loading,
  isAdmin,
  onChange,
}: {
  pillar: Pillar;
  groups: ReturnType<typeof outputIndicatorsByPillar>;
  rows: Record<string, LocalRow>;
  remote: RemoteState | null;
  loading: boolean;
  isAdmin: boolean;
  onChange: (key: string, field: keyof LocalRow, val: string) => void;
}) {
  const meta = PILLAR_META[pillar];
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-stretch border-b border-slate-200">
        <span aria-hidden="true" className={`w-1 ${meta.bgClass}`} />
        <div className="flex flex-1 items-center gap-3 px-6 py-4">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${meta.bgClass}`}
          >
            {meta.abbr}
          </span>
          <div>
            <h2 className="text-base font-bold text-[#1e3a5f]">{pillar}</h2>
            <p className="text-xs text-slate-500">{meta.short}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Indicator</th>
              <th className="px-4 py-2.5 text-right whitespace-nowrap">
                Annual target
              </th>
              <th className="px-4 py-2.5 text-right whitespace-nowrap">
                Achieved this Qtr
              </th>
              <th className="px-4 py-2.5 text-right whitespace-nowrap">
                Cumulative YTD
              </th>
              <th className="px-4 py-2.5">Comments</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <ParentGroup
                key={group.parent}
                group={group}
                pillar={pillar}
                rows={rows}
                remote={remote}
                loading={loading}
                isAdmin={isAdmin}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ParentGroup({
  group,
  pillar,
  rows,
  remote,
  loading,
  isAdmin,
  onChange,
}: {
  group: { parent: string; rows: OutputIndicatorMeta[] };
  pillar: Pillar;
  rows: Record<string, LocalRow>;
  remote: RemoteState | null;
  loading: boolean;
  isAdmin: boolean;
  onChange: (key: string, field: keyof LocalRow, val: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-slate-100 bg-slate-50/60">
        <td colSpan={5} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#1e3a5f]">
          {group.parent}
        </td>
      </tr>
      {group.rows.map((meta) => {
        const key = rowKey(pillar, meta.key);
        const row = rows[key];
        const cumulative = remote?.cumulative[key] ?? 0;
        const suffix = unitSuffix(meta);
        return (
          <tr key={meta.key} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-2 pl-10 text-slate-700">
              {meta.label}
              {meta.unit !== "count" && (
                <span className="ml-1 text-[10px] font-semibold uppercase text-slate-400">
                  {meta.unit}
                </span>
              )}
            </td>
            <td className="px-4 py-2 text-right">
              <CountInput
                value={row?.target ?? ""}
                onChange={(v) => onChange(key, "target", v)}
                disabled={loading || !isAdmin}
                suffix={suffix}
              />
            </td>
            <td className="px-4 py-2 text-right">
              <CountInput
                value={row?.value ?? ""}
                onChange={(v) => onChange(key, "value", v)}
                disabled={loading || !isAdmin}
                suffix={suffix}
              />
            </td>
            <td className="px-4 py-2 text-right tabular-nums font-semibold text-[#1e3a5f]">
              {formatNumber(cumulative, meta.unit)}
            </td>
            <td className="px-4 py-2">
              <input
                type="text"
                value={row?.comments ?? ""}
                onChange={(e) => onChange(key, "comments", e.target.value)}
                disabled={loading || !isAdmin}
                placeholder="Optional"
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50"
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}

function CountInput({
  value,
  onChange,
  disabled,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  suffix: string;
}) {
  return (
    <div className="relative inline-flex">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="0"
        className={`w-28 rounded-md border border-slate-200 bg-white py-1.5 text-right text-sm tabular-nums focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50 ${suffix ? "pr-6 pl-2" : "px-2"}`}
      />
      {suffix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400"
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
