"use client";

import { useAnalytics } from "@/components/dashboard/AnalyticsProvider";
import { StatusDot } from "@/components/dashboard/ThemeTag";
import { FAC_SHORT } from "@/lib/constants";
import { periodLabel } from "@/lib/analytics/periods";

export function PartnersView() {
  const { filteredActivities, period } = useAnalytics();
  const acts = filteredActivities.filter((a) => a.partnerInstitution);
  const partnerMap: Record<string, typeof acts> = {};
  acts.forEach((a) => {
    const p = a.partnerInstitution!;
    if (!partnerMap[p]) partnerMap[p] = [];
    partnerMap[p].push(a);
  });
  const partners = Object.keys(partnerMap).sort();

  if (partners.length === 0) {
    return (
      <div className="col-span-2 rounded-[10px] bg-white p-12 text-center shadow-sm">
        <h4 className="font-bold text-[#1e3a5f]">No partner data yet</h4>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500">
        {partners.length} partner{partners.length !== 1 ? "s" : ""} engaged
        {period !== "all" ? ` · ${periodLabel(period)}` : ""}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {partners.map((p) => {
          const pActs = partnerMap[p];
          const byMember: Record<string, { name: string; faculty: string; acts: typeof pActs }> = {};
          pActs.forEach((a) => {
            const n = a.submission.fullName;
            if (!byMember[n]) {
              byMember[n] = { name: n, faculty: a.submission.faculty, acts: [] };
            }
            byMember[n].acts.push(a);
          });
          return (
            <div key={p} className="overflow-hidden rounded-[10px] bg-white shadow-sm">
              <div className="bg-gradient-to-br from-[#152c47] to-[#2563a8] px-4 py-3.5 text-white">
                <p className="text-sm font-bold">{p}</p>
                <p className="text-[11px] text-white/70">
                  {pActs.length} activities · {Object.keys(byMember).length} faculty members
                </p>
              </div>
              <div className="px-4 py-2">
                {Object.values(byMember).map((m) => (
                  <div key={m.name} className="flex gap-2 border-b border-slate-100 py-2 text-xs last:border-0">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563a8]" />
                    <div>
                      <p className="font-semibold">
                        {m.name}{" "}
                        <span className="font-normal text-slate-500">
                          ({FAC_SHORT[m.faculty] || m.faculty})
                        </span>
                      </p>
                      {m.acts.map((a) => (
                        <p key={a.id} className="text-slate-500">
                          {a.title} · <StatusDot status={a.status} />
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
