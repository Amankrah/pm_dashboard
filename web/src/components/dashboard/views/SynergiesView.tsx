"use client";

import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "cross-pillar": { label: "Cross-pillar", color: "bg-blue-100 text-blue-900" },
  "multi-faculty-partner": { label: "Partner synergy", color: "bg-emerald-100 text-emerald-900" },
  "shared-contact": { label: "Shared contact", color: "bg-amber-100 text-amber-900" },
  "cross-faculty-collaboration": { label: "Cross-faculty", color: "bg-purple-100 text-purple-900" },
};

export function SynergiesView() {
  const { data, filteredActivities } = useAnalytics();
  const synergies = data?.synergies ?? [];

  const grouped = {
    "cross-pillar": synergies.filter((s) => s.type === "cross-pillar"),
    "multi-faculty-partner": synergies.filter((s) => s.type === "multi-faculty-partner"),
    "shared-contact": synergies.filter((s) => s.type === "shared-contact"),
    "cross-faculty-collaboration": synergies.filter((s) => s.type === "cross-faculty-collaboration"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#1e3a5f]">Synergies & cross-activities</h2>
        <p className="mt-1 text-sm text-slate-600">
          Automatically detected from {filteredActivities.length} activities in the selected period:
          multi-pillar work, partners engaged across faculties, shared contacts, and McGill collaborators.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(grouped).map(([type, list]) => (
          <div key={type} className="rounded-[10px] bg-white p-4 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-[#1e3a5f]">{list.length}</p>
            <p className="text-[11px] font-semibold text-slate-500">
              {TYPE_LABELS[type]?.label ?? type}
            </p>
          </div>
        ))}
      </div>

      {synergies.length === 0 ? (
        <div className="rounded-[10px] bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">No synergies detected for this period yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {synergies.map((s, i) => (
            <div
              key={`${s.type}-${i}`}
              className="rounded-[10px] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${TYPE_LABELS[s.type]?.color ?? "bg-slate-100"}`}
                >
                  {TYPE_LABELS[s.type]?.label ?? s.type}
                </span>
                <p className="flex-1 font-bold text-[#1e3a5f]">{s.title}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{s.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
