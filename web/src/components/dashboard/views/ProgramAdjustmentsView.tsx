"use client";

import { useEffect, useState } from "react";

type WorkplanRow = {
  id: string;
  initialPlan: string;
  change: string;
  reason: string;
  implications: string;
};

type RiskRow = {
  id: string;
  description: string;
  response: string;
};

function blankWorkplan(): WorkplanRow {
  return {
    id: crypto.randomUUID(),
    initialPlan: "",
    change: "",
    reason: "",
    implications: "",
  };
}

function blankRisk(): RiskRow {
  return {
    id: crypto.randomUUID(),
    description: "",
    response: "",
  };
}

export function ProgramAdjustmentsView({ isAdmin }: { isAdmin: boolean }) {
  const [programYear, setProgramYear] = useState(2);
  const [quarter, setQuarter] = useState(3);
  const [workplan, setWorkplan] = useState<WorkplanRow[]>([]);
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState("");
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
          `/api/program-adjustments?programYear=${programYear}&quarter=${quarter}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setMessage("Could not load program adjustments.");
          setTone("error");
          return;
        }
        const data = (await res.json()) as {
          workplan: Array<{
            initialPlan: string;
            change: string;
            reason: string | null;
            implications: string | null;
          }>;
          risks: Array<{ description: string; response: string | null }>;
          upcomingActivities: string | null;
        };
        if (cancelled) return;
        setWorkplan(
          data.workplan.map((w) => ({
            id: crypto.randomUUID(),
            initialPlan: w.initialPlan,
            change: w.change,
            reason: w.reason ?? "",
            implications: w.implications ?? "",
          })),
        );
        setRisks(
          data.risks.map((r) => ({
            id: crypto.randomUUID(),
            description: r.description,
            response: r.response ?? "",
          })),
        );
        setUpcomingActivities(data.upcomingActivities ?? "");
      } catch {
        if (!cancelled) {
          setMessage("Network error loading program adjustments.");
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

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/program-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programYear,
          quarter,
          workplan: workplan.map((w) => ({
            initialPlan: w.initialPlan,
            change: w.change,
            reason: w.reason || null,
            implications: w.implications || null,
          })),
          risks: risks.map((r) => ({
            description: r.description,
            response: r.response || null,
          })),
          upcomingActivities: upcomingActivities || null,
        }),
      });
      if (!res.ok) {
        setMessage("Save failed. Admin access required.");
        setTone("error");
        return;
      }
      setMessage(`Saved Y${programYear}Q${quarter}.`);
      setTone("success");
    } catch {
      setMessage("Network error saving program adjustments.");
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
        <h1 className="text-lg font-bold text-[#1e3a5f]">Program adjustments</h1>
        <p className="mt-1 text-sm text-slate-600">
          Section 3 of the Partner Narrative Report. Captures changes to the
          initial Workplan, emerging risks and how the programme is responding,
          and a brief summary of upcoming activities.
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

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#1e3a5f]">
            Workplan adjustments
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Key changes to items in the initial Workplan and any adjustments
            informed by lessons learned this quarter.
          </p>
        </div>

        {workplan.length === 0 ? (
          <p className="px-6 py-5 text-sm italic text-slate-500">
            No workplan adjustments. This will be marked N/A in the report.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {workplan.map((row, idx) => (
              <li key={row.id} className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-[#1e3a5f] px-1.5 text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-[#1e3a5f]">
                      Adjustment {idx + 1}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        setWorkplan((rows) => rows.filter((r) => r.id !== row.id))
                      }
                      className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Initial Plan"
                    required
                    value={row.initialPlan}
                    onChange={(v) =>
                      setWorkplan((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, initialPlan: v } : r,
                        ),
                      )
                    }
                    disabled={!isAdmin}
                    placeholder="As per the Annual Workplan / Schedule C…"
                  />
                  <Field
                    label="Proposed or Implemented Change"
                    required
                    value={row.change}
                    onChange={(v) =>
                      setWorkplan((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, change: v } : r,
                        ),
                      )
                    }
                    disabled={!isAdmin}
                    placeholder="What changed in practice…"
                  />
                  <Field
                    label="Reason for change"
                    value={row.reason}
                    onChange={(v) =>
                      setWorkplan((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, reason: v } : r,
                        ),
                      )
                    }
                    disabled={!isAdmin}
                    placeholder="Why the change was needed…"
                  />
                  <Field
                    label="Implications of change"
                    value={row.implications}
                    onChange={(v) =>
                      setWorkplan((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, implications: v } : r,
                        ),
                      )
                    }
                    disabled={!isAdmin}
                    placeholder="Positive or otherwise…"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <div className="border-t border-slate-200 px-6 py-3">
            <button
              type="button"
              onClick={() =>
                setWorkplan((rows) => [...rows, blankWorkplan()])
              }
              className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#2563a8] bg-white px-4 py-2 text-[13px] font-bold text-[#2563a8] transition-colors hover:bg-[#eef3fa]"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              Add a workplan adjustment
            </button>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#1e3a5f]">Risks</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            New risks (or changes to existing risks) that may affect the
            programme&apos;s success, and how the team is responding.
          </p>
        </div>

        {risks.length === 0 ? (
          <p className="px-6 py-5 text-sm italic text-slate-500">
            No risks logged for this quarter.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {risks.map((row, idx) => (
              <li key={row.id} className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-[#a05c00] px-1.5 text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-[#1e3a5f]">
                      Risk {idx + 1}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        setRisks((rows) => rows.filter((r) => r.id !== row.id))
                      }
                      className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Risk description"
                    required
                    value={row.description}
                    onChange={(v) =>
                      setRisks((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, description: v } : r,
                        ),
                      )
                    }
                    disabled={!isAdmin}
                    placeholder="What is the risk?"
                  />
                  <Field
                    label="Response approach"
                    value={row.response}
                    onChange={(v) =>
                      setRisks((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, response: v } : r,
                        ),
                      )
                    }
                    disabled={!isAdmin}
                    placeholder="How is the team responding?"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <div className="border-t border-slate-200 px-6 py-3">
            <button
              type="button"
              onClick={() => setRisks((rows) => [...rows, blankRisk()])}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#a05c00] bg-white px-4 py-2 text-[13px] font-bold text-[#a05c00] transition-colors hover:bg-[#fff4dc]"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              Add a risk
            </button>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#1e3a5f]">
            Upcoming activities, dates, and events
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            A brief look-ahead for the next reporting period.
          </p>
        </div>
        <div className="px-6 py-5">
          <textarea
            value={upcomingActivities}
            onChange={(e) => setUpcomingActivities(e.target.value)}
            disabled={loading || !isAdmin}
            rows={5}
            placeholder="What is coming up next quarter? Key milestones, events, partner visits, deadlines…"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50"
          />
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-semibold text-[#1e293b]">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 disabled:bg-slate-50"
      />
    </div>
  );
}
