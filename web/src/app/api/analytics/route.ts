import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadAnalyticsBundle } from "@/lib/analytics/data";
import { filterByPeriod } from "@/lib/analytics/periods";
import { buildPeriodOptions } from "@/lib/analytics/periods";
import { computeSynergies } from "@/lib/analytics/synergies";
import { loadTargetsFromDb } from "@/lib/analytics/targets-db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "all";

  const bundle = await loadAnalyticsBundle();
  const filtered = filterByPeriod(bundle.activities, period);
  const synergies = computeSynergies(filtered);
  const targets = await loadTargetsFromDb();

  return NextResponse.json({
    period,
    periodOptions: buildPeriodOptions(bundle.activities),
    submissions: bundle.submissions,
    activities: bundle.activities,
    filteredActivities: filtered,
    filteredSubmissions: bundle.submissions.filter((s) =>
      s.activities.some((a) => filtered.some((f) => f.id === a.id)),
    ),
    synergies,
    targets,
    counts: {
      submissions: bundle.submissionCount,
      activities: bundle.activities.length,
      filtered: filtered.length,
    },
  });
}
