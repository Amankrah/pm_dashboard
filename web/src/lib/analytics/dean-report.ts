import { FAC_FULL_NAMES, FAC_KEYS, FAC_MATCH } from "@/lib/constants";
import type { FlatActivity, SubmissionRow } from "@/lib/analytics/types";
import { filterByPeriod, periodLabel } from "@/lib/analytics/periods";
import { countByStatus } from "@/lib/analytics/metrics-core";
import { openReportWindow } from "@/lib/analytics/reports";

export function generateDeanReportHtml(
  facultyKey: string,
  submissions: SubmissionRow[],
  allActivities: FlatActivity[],
  period: string,
) {
  if (!(FAC_KEYS as readonly string[]).includes(facultyKey)) {
    throw new Error("Invalid faculty key");
  }
  const fk = facultyKey;

  const facFullKey = FAC_MATCH[fk];
  const facSubs = submissions.filter((s) => s.faculty === facFullKey);
  const acts = filterByPeriod(
    facSubs.flatMap((s) => s.activities),
    period,
  );
  const stats = countByStatus(acts);
  const partners = new Set(acts.map((a) => a.partnerInstitution).filter(Boolean));
  const today = new Date().toLocaleDateString("en-CA");
  const periodLbl = period === "all" ? "Full Project" : periodLabel(period);
  const compPct =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const memberRows = facSubs
    .map((s) => {
      const mActs = filterByPeriod(s.activities, period);
      const mDone = mActs.filter((a) => a.status === "Completed").length;
      const mPillars = [...new Set(mActs.flatMap((a) => a.themes))].join(", ");
      return `<tr><td>${s.fullName}</td><td>${s.position || "—"}</td><td style="text-align:center">${mActs.length}</td><td style="text-align:center;color:#15803d;font-weight:700">${mDone}</td><td>${mPillars || "—"}</td></tr>`;
    })
    .join("");

  const actRows = acts
    .map((a) => {
      const sc =
        a.status === "Completed"
          ? "#15803d"
          : a.status === "Ongoing"
            ? "#a05c00"
            : "#1e3a5f";
      return `<tr><td>${a.title}</td><td>${a.submission.fullName}</td><td>${a.themes.join(", ")}</td><td style="color:${sc};font-weight:600">${a.status}</td><td>${a.partnerInstitution || "—"}</td></tr>`;
    })
    .join("");

  const coverStats = [
    ["Total", stats.total],
    ["Completed", stats.completed],
    ["Ongoing", stats.ongoing],
    ["Planned", stats.planned],
    ["Partners", partners.size],
  ]
    .map(
      ([l, n]) =>
        `<div style="text-align:center"><div style="font-size:28px;font-weight:800;line-height:1">${n}</div><div style="font-size:11px;opacity:0.65">${l}</div></div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fk} Dean Report — ${periodLbl}</title><style>
body{font-family:'Segoe UI',Arial,sans-serif;max-width:880px;margin:0 auto;padding:40px;color:#1a202c}
.cover{background:linear-gradient(135deg,#152c47,#1e3a5f);color:#fff;padding:36px;border-radius:12px;margin-bottom:32px}
.cover-sub{font-size:12px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.cover h1{font-size:22px;font-weight:900;margin:0 0 4px}.cover h2{font-size:14px;font-weight:400;opacity:0.75;margin:0 0 20px}
.section{margin-bottom:26px}.section h3{font-size:15px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:12.5px}th{background:#1e3a5f;color:#fff;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase}td{padding:9px 12px;border-bottom:1px solid #f1f5f9}
.no-print{display:flex;gap:10px;justify-content:flex-end;margin-bottom:20px}.btn{padding:9px 20px;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer}.btn-p{background:#1e3a5f;color:#fff}.btn-c{background:#f1f5f9;color:#334155}
@media print{.no-print{display:none!important}}</style></head><body>
<div class="no-print"><button class="btn btn-p" onclick="window.print()">Print / Save PDF</button><button class="btn btn-c" onclick="window.close()">Close</button></div>
<div class="cover">
<div class="cover-sub">Nkabom Africa–Agrifood Collaborative · McGill University</div>
<h1>${FAC_FULL_NAMES[fk]} (${fk})</h1>
<h2>Nkabom Collaborative Activity Report — ${periodLbl} · Generated ${today}</h2>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:12px">${coverStats}</div>
</div>
<div class="section"><h3>Executive Summary</h3>
<p style="background:#eef3fa;padding:14px 18px;border-radius:8px;border-left:4px solid #1e3a5f;font-size:13px;line-height:1.7">
The ${FAC_FULL_NAMES[fk]} has recorded <strong>${stats.total} activit${stats.total !== 1 ? "ies" : "y"}</strong> under the Nkabom Collaborative for <strong>${periodLbl}</strong>.
Of these, <strong>${stats.completed} (${compPct}%) are completed</strong>, ${stats.ongoing} are ongoing, and ${stats.planned} are planned.
The faculty engaged <strong>${partners.size} Ghanaian partner institution${partners.size !== 1 ? "s" : ""}</strong>, with <strong>${facSubs.length} faculty member${facSubs.length !== 1 ? "s" : ""}</strong> submitting reports.
</p></div>
<div class="section"><h3>Faculty Member Performance</h3>
<table><thead><tr><th>Name</th><th>Position</th><th>Activities</th><th>Completed</th><th>Pillars</th></tr></thead><tbody>
${memberRows || '<tr><td colspan="5" style="text-align:center;color:#64748b;font-style:italic">No submissions</td></tr>'}
</tbody></table></div>
${partners.size > 0 ? `<div class="section"><h3>Partner Institutions</h3><ul style="columns:2;gap:24px;font-size:13px;line-height:2">${[...partners].sort().map((p) => `<li>${p}</li>`).join("")}</ul></div>` : ""}
${acts.length > 0 ? `<div class="section"><h3>Activity Details</h3><table><thead><tr><th>Activity</th><th>Faculty Member</th><th>Pillars</th><th>Status</th><th>Partner</th></tr></thead><tbody>${actRows}</tbody></table></div>` : ""}
<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px">Nkabom Faculty Activity Map · Academic Lead Office · McGill University · ${today}</p>
</body></html>`;
}

export function openDeanReport(
  facultyKey: string,
  submissions: SubmissionRow[],
  allActivities: FlatActivity[],
  period: string,
) {
  const html = generateDeanReportHtml(
    facultyKey,
    submissions,
    allActivities,
    period,
  );
  openReportWindow(html);
}
