"use client";

import { useState } from "react";
import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { generateReportHtml, openReportWindow } from "@/lib/analytics/reports";

const REPORT_TYPES = [
  { id: "monthly", name: "Monthly", desc: "Single month summary" },
  { id: "quarterly", name: "Quarterly", desc: "Quarter progress" },
  { id: "annual", name: "Annual", desc: "Full year report" },
  { id: "overall", name: "Overall", desc: "All periods" },
];

export function ReportsView() {
  const { data, period } = useAnalytics();
  const [reportType, setReportType] = useState("monthly");
  const [reportPeriod, setReportPeriod] = useState(period);
  const [history, setHistory] = useState<{ title: string; generated: string; html: string }[]>([]);

  function generate() {
    if (!data) return;
    const html = generateReportHtml(
      data.activities,
      data.submissions.map((s) => ({ fullName: s.fullName, faculty: s.faculty })),
      reportPeriod,
      reportType,
    );
    openReportWindow(html);
    const today = new Date().toLocaleDateString("en-CA");
    const title = `${REPORT_TYPES.find((t) => t.id === reportType)?.name ?? "Report"} · ${reportPeriod}`;
    setHistory((h) => [{ title, generated: today, html }, ...h].slice(0, 10));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[10px] bg-white p-6 shadow-sm">
        <h3 className="font-extrabold text-[#1e3a5f]">Generate progress reports</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setReportType(t.id)}
              className={`rounded-[10px] border-2 p-4 text-center transition-colors ${
                reportType === t.id
                  ? "border-[#1e3a5f] bg-[#eef3fa]"
                  : "border-slate-200 hover:border-[#2563a8]"
              }`}
            >
              <div className="text-sm font-bold text-[#1e3a5f]">{t.name}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{t.desc}</div>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label
            htmlFor="report-period-select"
            className="text-xs font-bold text-slate-700"
          >
            Report period:
          </label>
          <select
            id="report-period-select"
            name="reportPeriod"
            aria-label="Report period"
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {(data?.periodOptions ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={generate}
            className="rounded-lg bg-[#c8102e] px-6 py-2.5 text-sm font-bold text-white"
          >
            Generate report
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Opens a printable window. Use Print, then Save as PDF. Report period is independent of the topbar filter unless you match them.
        </p>
      </div>

      {history.length > 0 && (
        <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
          <div className="bg-[#1e3a5f] px-5 py-2.5 text-xs font-bold text-white">
            Recently generated (this session)
          </div>
          {history.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 text-sm last:border-0"
            >
              <div className="flex-1">
                <p className="font-semibold">{r.title}</p>
                <p className="text-[11px] text-slate-500">{r.generated}</p>
              </div>
              <button
                type="button"
                onClick={() => openReportWindow(r.html)}
                className="rounded-md bg-[#2563a8] px-3 py-1 text-[11px] font-semibold text-white"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
