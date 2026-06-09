"use client";

import { useEffect, useMemo, useState } from "react";
import { PILLARS, PILLAR_META, type Pillar } from "@/lib/constants";
import {
  OUTCOME_INDICATORS,
  outcomeIndicatorGroups,
  type OutcomeIndicatorMeta,
} from "@/lib/analytics/outcome-indicators";

// Layout choice: outcome rows × pillar columns matches the docx exactly.
// Each (pillar, indicator) cell takes a value; YTD cumulative shows below
// each value as a smaller, dimmed number.

type RemoteState = {
  targets: Record<string, number>;
  entries: Record<string, { value: number; comments: string | null }>;
  cumulative: Record<string, number>;
};

type Cell = { value: string; comments: string };

function rowKey(pillar: string, indicator: string) {
  return `${pillar}::${indicator}`;
}

function emptyCellMap(): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  for (const meta of OUTCOME_INDICATORS) {
    for (const p of PILLARS) {
      out[rowKey(p, meta.key)] = { value: "", comments: "" };
    }
  }
  return out;
}

function emptyTargetMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const meta of OUTCOME_INDICATORS) {
    for (const p of PILLARS) {
      out[rowKey(p, meta.key)] = "";
    }
  }
  return out;
}

function unitSuffix(meta: OutcomeIndicatorMeta) {
  return meta.unit === "percent" ? "%" : "";
}

function formatCell(n: number, meta: OutcomeIndicatorMeta) {
  if (meta.unit === "percent") return `${n}%`;
  return n.toLocaleString();
}

export function OutcomeIndicatorsView({ isAdmin }: { isAdmin: boolean }) {
  const [programYear, setProgramYear] = useState(2);
  const [quarter, setQuarter] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "success" | "error">("info");
  const [cells, setCells] = useState<Record<string, Cell>>(() => emptyCellMap());
  const [targets, setTargets] = useState<Record<string, string>>(() => emptyTargetMap());
  const [remote, setRemote] = useState<RemoteState | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/outcome-indicators?programYear=${programYear}&quarter=${quarter}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setMessage("Could not load outcome indicators.");
          setTone("error");
          return;
        }
        const data = (await res.json()) as RemoteState;
        if (cancelled) return;
        setRemote(data);
        const nextCells: Record<string, Cell> = {};
        const nextTargets: Record<string, string> = {};
        for (const meta of OUTCOME_INDICATORS) {
          for (const p of PILLARS) {
            const k = rowKey(p, meta.key);
            nextCells[k] = {
              value:
                data.entries[k]?.value !== undefined
                  ? String(data.entries[k]!.value)
                  : "",
              comments: data.entries[k]?.comments ?? "",
            };
            nextTargets[k] =
              data.targets[k] !== undefined ? String(data.targets[k]) : "";
          }
        }
        setCells(nextCells);
        setTargets(nextTargets);
      } catch {
        if (!cancelled) {
          setMessage("Network error loading outcome indicators.");
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

  const groups = useMemo(() => outcomeIndicatorGroups(), []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const payloadTargets: Array<{
        pillar: string;
        indicator: string;
        target: number;
      }> = [];
      const payloadEntries: Array<{
        pillar: string;
        indicator: string;
        value: number;
        comments: string | null;
      }> = [];
      for (const meta of OUTCOME_INDICATORS) {
        for (const p of PILLARS) {
          const k = rowKey(p, meta.key);
          const tRaw = targets[k]?.trim();
          const t = tRaw ? Number(tRaw) : 0;
          payloadTargets.push({
            pillar: p,
            indicator: meta.key,
            target: Number.isFinite(t) && t >= 0 ? Math.floor(t) : 0,
          });
          const c = cells[k];
          const vRaw = c?.value.trim();
          const v = vRaw ? Number(vRaw) : 0;
          payloadEntries.push({
            pillar: p,
            indicator: meta.key,
            value: Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0,
            comments: c?.comments.trim() || null,
          });
        }
      }
      const res = await fetch("/api/outcome-indicators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programYear,
          quarter,
          targets: payloadTargets,
          entries: payloadEntries,
        }),
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
      setMessage("Network error saving outcome indicators.");
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
        <h1 className="text-lg font-bold text-[#1e3a5f]">Outcome indicators</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cross-pillar outcome metrics from Section 4 of the Partner Narrative
          Report. Rows are outcome metrics; columns are pillars. Fill cells
          where applicable; leave blank where N/A. Cumulative YTD sums every
          quarter saved so far.
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
        {loading && <span className="text-xs text-slate-500">Loading…</span>}
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

      {groups.map((group) => (
        <ParentSection
          key={group.parent}
          parent={group.parent}
          rows={group.rows}
          cells={cells}
          targets={targets}
          remote={remote}
          loading={loading}
          isAdmin={isAdmin}
          onCellChange={(k, field, val) =>
            setCells((prev) => ({
              ...prev,
              [k]: { ...prev[k]!, [field]: val },
            }))
          }
          onTargetChange={(k, val) =>
            setTargets((prev) => ({ ...prev, [k]: val }))
          }
        />
      ))}
    </div>
  );
}

function ParentSection({
  parent,
  rows,
  cells,
  targets,
  remote,
  loading,
  isAdmin,
  onCellChange,
  onTargetChange,
}: {
  parent: string;
  rows: OutcomeIndicatorMeta[];
  cells: Record<string, Cell>;
  targets: Record<string, string>;
  remote: RemoteState | null;
  loading: boolean;
  isAdmin: boolean;
  onCellChange: (key: string, field: keyof Cell, val: string) => void;
  onTargetChange: (key: string, val: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-bold text-[#1e3a5f]">{parent}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Outcome</th>
              {PILLARS.map((p) => {
                const m = PILLAR_META[p as Pillar];
                return (
                  <th
                    key={p}
                    className="px-3 py-2.5 text-center"
                    style={{ minWidth: 140 }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white ${m.bgClass}`}
                      >
                        {m.abbr}
                      </span>
                      <span>{p}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((meta) => (
              <OutcomeRow
                key={meta.key}
                meta={meta}
                cells={cells}
                targets={targets}
                remote={remote}
                loading={loading}
                isAdmin={isAdmin}
                onCellChange={onCellChange}
                onTargetChange={onTargetChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OutcomeRow({
  meta,
  cells,
  targets,
  remote,
  loading,
  isAdmin,
  onCellChange,
  onTargetChange,
}: {
  meta: OutcomeIndicatorMeta;
  cells: Record<string, Cell>;
  targets: Record<string, string>;
  remote: RemoteState | null;
  loading: boolean;
  isAdmin: boolean;
  onCellChange: (key: string, field: keyof Cell, val: string) => void;
  onTargetChange: (key: string, val: string) => void;
}) {
  const suffix = unitSuffix(meta);
  return (
    <tr className="border-b border-slate-100 last:border-0 align-top">
      <td className="px-4 py-3 align-top">
        <p className="text-sm font-semibold text-[#1e3a5f]">{meta.label}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {meta.unit === "percent" ? "Percentage" : "Count"}
        </p>
      </td>
      {PILLARS.map((p) => {
        const k = rowKey(p, meta.key);
        const cumulative = remote?.cumulative[k] ?? 0;
        return (
          <td key={p} className="px-3 py-3 align-top">
            <div className="flex flex-col items-stretch gap-1.5">
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tgt
                </span>
                <CountInput
                  value={targets[k] ?? ""}
                  onChange={(v) => onTargetChange(k, v)}
                  disabled={loading || !isAdmin}
                  suffix={suffix}
                  width="w-16"
                />
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]">
                  Qtr
                </span>
                <CountInput
                  value={cells[k]?.value ?? ""}
                  onChange={(v) => onCellChange(k, "value", v)}
                  disabled={loading || !isAdmin}
                  suffix={suffix}
                  width="w-16"
                  highlight
                />
              </div>
              <p className="text-right text-[10px] text-slate-500">
                YTD{" "}
                <span className="font-semibold text-slate-700">
                  {formatCell(cumulative, meta)}
                </span>
              </p>
              <input
                type="text"
                value={cells[k]?.comments ?? ""}
                onChange={(e) => onCellChange(k, "comments", e.target.value)}
                disabled={loading || !isAdmin}
                placeholder="Comments"
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50"
              />
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function CountInput({
  value,
  onChange,
  disabled,
  suffix,
  width = "w-24",
  highlight = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  suffix: string;
  width?: string;
  highlight?: boolean;
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
        className={`${width} rounded-md border ${highlight ? "border-[#2563a8]" : "border-slate-200"} bg-white py-1 text-right text-xs tabular-nums focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50 ${suffix ? "pl-2 pr-5" : "px-2"}`}
      />
      {suffix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
