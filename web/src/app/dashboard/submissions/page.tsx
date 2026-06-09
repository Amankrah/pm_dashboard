import { ImportSubmissions } from "@/components/ImportSubmissions";
import { SubmissionsTable } from "@/components/dashboard/SubmissionsTable";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SubmissionsPage() {
  const session = await getSession();
  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      activities: { include: { themes: true } },
      period: { select: { label: true, reportKey: true } },
    },
  });
  const campaigns = await prisma.reportingPeriod.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true },
  });

  const rows = submissions.map((s) => {
    const themes = new Set(
      s.activities.flatMap((a) => a.themes.map((t) => t.theme)),
    );
    return {
      id: s.id,
      fullName: s.fullName,
      faculty: s.faculty,
      periodLabel: s.period.label,
      reportKey: s.period.reportKey,
      activityCount: s.activities.length,
      themes: [...themes],
      crossPillar: s.activities.some((a) => a.themes.length > 1),
      submittedAt: s.submittedAt.toLocaleDateString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f]">
          Submissions and import
        </h1>
        <p className="text-sm text-slate-600">
          Raw database records ({submissions.length}). Click a row to view the
          full submission. Use the analytics views for charts and filters.
        </p>
      </div>

      {requireAdmin(session) && <ImportSubmissions campaigns={campaigns} />}

      <SubmissionsTable rows={rows} />
    </div>
  );
}
