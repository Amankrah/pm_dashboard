"use client";

import { useMemo, useState } from "react";
import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { StatusDot, ThemeTag } from "@/components/dashboard/ThemeTag";
import { FAC_SHORT } from "@/lib/constants";

export function ActivityMapView() {
  const { filteredActivities } = useAnalytics();
  const [search, setSearch] = useState("");
  const [pillar, setPillar] = useState("");
  const [status, setStatus] = useState("");
  const [faculty, setFaculty] = useState("");

  const rows = useMemo(() => {
    let acts = filteredActivities;
    if (search) {
      const q = search.toLowerCase();
      acts = acts.filter((a) =>
        [a.title, a.submission.fullName, a.partnerInstitution, a.description]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    if (pillar) acts = acts.filter((a) => a.themes.includes(pillar));
    if (status) acts = acts.filter((a) => a.status === status);
    if (faculty) acts = acts.filter((a) => a.submission.faculty === faculty);
    return acts;
  }, [filteredActivities, search, pillar, status, faculty]);

  function exportCsv() {
    const headers = [
      "Faculty Member", "Faculty", "Activity", "Pillars", "Status",
      "Partner", "Contact", "Start", "End",
    ];
    const lines = rows.map((a) =>
      [
        a.submission.fullName,
        a.submission.faculty,
        a.title,
        a.themes.join("; "),
        a.status,
        a.partnerInstitution ?? "",
        a.contactEmail ?? "",
        a.startDate ?? "",
        a.endDate ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [headers.map((h) => `"${h}"`), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `Nkabom_Activities_${new Date().toISOString().slice(0, 10)}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#1e3a5f]">All Activities</h2>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md bg-[#c8102e] px-3.5 py-1.5 text-xs font-bold text-white"
        >
          Export CSV
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[180px] flex-1">
          <span className="sr-only">Search activities</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities, faculty, partners…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="mb-1 block">Pillar</span>
          <select
            id="activity-map-pillar"
            name="pillar"
            aria-label="Filter by pillar"
            value={pillar}
            onChange={(e) => setPillar(e.target.value)}
            className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Pillars</option>
            <option value="Education">Education</option>
            <option value="Access and Success">Access & Success</option>
            <option value="Entrepreneurship">Entrepreneurship</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="mb-1 block">Status</span>
          <select
            id="activity-map-status"
            name="status"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Planned">Planned</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="mb-1 block">Faculty</span>
          <select
            id="activity-map-faculty"
            name="faculty"
            aria-label="Filter by faculty"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Faculties</option>
            <option value="Agricultural and Environmental Sciences (AES)">AES</option>
            <option value="School of Continuing Education">SCS</option>
            <option value="School of Population and Global Health (SPGH)">SPGH</option>
            <option value="Sustainability Growth Initiative (SGI)">SGI</option>
          </select>
        </label>
      </div>
      <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
        <table className="w-full text-left text-[12.5px]">
          <thead className="bg-[#1e3a5f] text-[11px] font-bold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3.5 py-2.5">Activity</th>
              <th className="px-3.5 py-2.5">Member</th>
              <th className="px-3.5 py-2.5">Faculty</th>
              <th className="px-3.5 py-2.5">Pillar(s)</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Partner</th>
              <th className="px-3.5 py-2.5">Dates</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3.5 py-8 text-center italic text-slate-500">No activities match filters.</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-blue-50/50">
                  <td className="px-3.5 py-2.5">
                    <strong>{a.title}</strong>
                    {a.collaborators.length > 0 && (
                      <span className="ml-1 rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800">
                        +{a.collaborators.length} collab
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">{a.submission.fullName}</td>
                  <td className="px-3.5 py-2.5 text-[11px]">{FAC_SHORT[a.submission.faculty] || a.submission.faculty}</td>
                  <td className="px-3.5 py-2.5">{a.themes.map((t) => <ThemeTag key={t} theme={t} />)}</td>
                  <td className="px-3.5 py-2.5"><StatusDot status={a.status} /></td>
                  <td className="px-3.5 py-2.5 text-[11px]">{a.partnerInstitution || "—"}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[11px]">
                    {a.startDate}{a.startDate && a.endDate ? " → " : ""}{a.endDate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
