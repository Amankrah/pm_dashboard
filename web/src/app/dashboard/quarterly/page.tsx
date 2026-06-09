import { redirect } from "next/navigation";
import { QuarterlyRollupView } from "@/components/dashboard/views/QuarterlyRollupView";
import { getSession } from "@/lib/auth";
import { loadAnalyticsBundle } from "@/lib/analytics/data";
import { prisma } from "@/lib/db";

export default async function QuarterlyRollupPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bundle = await loadAnalyticsBundle();

  // Only periods that have a quarterly identifier participate in the
  // rollup. Sorted newest-first so the picker defaults to the most recent.
  const periods = (
    await prisma.reportingPeriod.findMany({
      where: { reportKey: { not: null } },
      orderBy: [
        { programYear: "desc" },
        { quarter: "desc" },
      ],
      select: {
        id: true,
        label: true,
        reportKey: true,
        programYear: true,
        quarter: true,
      },
    })
  )
    .filter(
      (
        p,
      ): p is {
        id: string;
        label: string;
        reportKey: string;
        programYear: number;
        quarter: number;
      } => p.reportKey !== null && p.programYear !== null && p.quarter !== null,
    );

  return (
    <QuarterlyRollupView
      activities={bundle.activities}
      periods={periods}
    />
  );
}
