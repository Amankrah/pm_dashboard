import { FAC_SHORT, PILLARS } from "@/lib/constants";
import type { FlatActivity } from "@/lib/analytics/types";
import { filterByPeriod, periodLabel } from "@/lib/analytics/periods";
import { countByStatus, pillarStats } from "@/lib/analytics/metrics-core";

export function generateReportHtml(
  acts: FlatActivity[],
  submissions: { fullName: string; faculty: string }[],
  period: string,
  reportType: string,
) {
  const filtered = filterByPeriod(acts, period);
  const label = periodLabel(period);
  const today = new Date().toLocaleDateString("en-CA");
  const stats = countByStatus(filtered);
  const partners = new Set(filtered.map((a) => a.partnerInstitution).filter(Boolean));
  const compPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const typeLabel: Record<string, string> = {
    monthly: "Monthly Progress Report",
    quarterly: "Quarterly Progress Report",
    annual: "Annual Progress Report",
    overall: "Overall Project Report",
  };

  const pillarRows = PILLARS.map((key) => {
    const { done, going, plan, tot } = pillarStats(filtered, key);
    const pct = tot > 0 ? Math.round((done / tot) * 100) : 0;
    return `<tr><td><strong>${key}</strong></td><td style="text-align:center">${tot}</td><td style="text-align:center;color:#15803d"><strong>${done}</strong></td><td style="text-align:center;color:#a05c00">${going}</td><td style="text-align:center;color:#1e3a5f">${plan}</td><td style="text-align:center">${pct}%</td></tr>`;
  }).join("");

  const actDetails = filtered
    .map(
      (a) =>
        `<tr><td>${a.title}</td><td>${FAC_SHORT[a.submission.faculty] || a.submission.faculty}</td><td>${a.themes.join(", ")}</td><td style="font-weight:600">${a.status}</td><td>${a.partnerInstitution || "—"}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${typeLabel[reportType] ?? "Report"} — ${label}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:900px;margin:0 auto;padding:40px;color:#1a202c}
.cover{background:linear-gradient(135deg,#152c47,#1e3a5f);color:#fff;padding:40px;border-radius:12px;margin-bottom:32px}
.cover h1{font-size:22px;font-weight:800;margin:0 0 6px}.cover h2{font-size:15px;font-weight:400;opacity:0.75}
.cover-meta{display:flex;gap:24px;margin-top:16px;flex-wrap:wrap}.cover-stat .n{font-size:32px;font-weight:800}.cover-stat .l{font-size:11px;opacity:0.65}
.section{margin-bottom:28px}.section h3{font-size:15px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:13px}th{background:#1e3a5f;color:#fff;padding:9px 12px;text-align:left;font-size:11px}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9}
.exec-box{background:#eef3fa;border-left:4px solid #1e3a5f;padding:16px 20px;border-radius:0 8px 8px 0;font-size:13px;line-height:1.7}
.no-print{display:flex;gap:10px;justify-content:flex-end;margin-bottom:20px}.btn{padding:10px 22px;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer}.btn-print{background:#1e3a5f;color:#fff}
@media print{.no-print{display:none!important}}</style></head><body>
<div class="no-print"><button class="btn btn-print" onclick="window.print()">Print / Save PDF</button></div>
<div class="cover">
<div style="font-size:12px;opacity:0.6;text-transform:uppercase;margin-bottom:8px">Nkabom Collaborative · McGill University</div>
<h1>${typeLabel[reportType] ?? "Progress Report"}</h1>
<h2>Reporting Period: ${label} · Generated: ${today}</h2>
<div class="cover-meta">
<div class="cover-stat"><div class="n">${stats.total}</div><div class="l">Activities</div></div>
<div class="cover-stat"><div class="n">${stats.completed}</div><div class="l">Completed</div></div>
<div class="cover-stat"><div class="n">${submissions.length}</div><div class="l">Submissions</div></div>
<div class="cover-stat"><div class="n">${partners.size}</div><div class="l">Partners</div></div>
</div></div>
<div class="section"><h3>Executive Summary</h3>
<div class="exec-box">For <strong>${label}</strong>, the programme recorded <strong>${stats.total} activities</strong>, with <strong>${stats.completed} (${compPct}%) completed</strong>, ${stats.ongoing} ongoing, and ${stats.planned} planned. <strong>${partners.size} partner institutions</strong> were engaged across ${submissions.length} faculty submissions.</div></div>
<div class="section"><h3>Progress by Strategic Pillar</h3>
<table><thead><tr><th>Pillar</th><th>Total</th><th>Completed</th><th>Ongoing</th><th>Planned</th><th>%</th></tr></thead><tbody>${pillarRows}</tbody></table></div>
${filtered.length > 0 ? `<div class="section"><h3>Activity Listing</h3><table><thead><tr><th>Activity</th><th>Faculty</th><th>Pillars</th><th>Status</th><th>Partner</th></tr></thead><tbody>${actDetails}</tbody></table></div>` : ""}
<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:32px">Nkabom Faculty Activity Map · Academic Lead Office · ${today}</p>
</body></html>`;
}

export function openReportWindow(html: string) {
  const w = window.open("", "_blank", "width=960,height=800,scrollbars=yes");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}
