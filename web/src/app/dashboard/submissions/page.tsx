import { ImportSubmissions } from "@/components/ImportSubmissions";
import { StatusDot, ThemeTag } from "@/components/dashboard/ThemeTag";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SubmissionsPage() {
  const session = await getSession();
  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      activities: { include: { themes: true } },
      period: { select: { label: true } },
    },
  });
  const campaigns = await prisma.reportingPeriod.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f]">Submissions & import</h1>
        <p className="text-sm text-slate-600">
          Raw database records ({submissions.length}). Use the analytics views for charts and filters.
        </p>
      </div>

      {requireAdmin(session) && <ImportSubmissions campaigns={campaigns} />}

      <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1e3a5f] text-xs uppercase text-white">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Activities</th>
              <th className="px-4 py-3">Pillars</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const themes = new Set(
                s.activities.flatMap((a) => a.themes.map((t) => t.theme)),
              );
              const cross = s.activities.some((a) => a.themes.length > 1);
              return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">{s.fullName}</td>
                  <td className="px-4 py-3 text-xs">{s.faculty}</td>
                  <td className="px-4 py-3">{s.period.label}</td>
                  <td className="px-4 py-3">{s.activities.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {[...themes].map((t) => (
                        <ThemeTag key={t} theme={t} />
                      ))}
                    </div>
                    {cross && (
                      <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">
                        cross-pillar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {s.submittedAt.toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
