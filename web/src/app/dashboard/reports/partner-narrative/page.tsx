import { redirect } from "next/navigation";
import { PartnerNarrativeReport } from "@/components/dashboard/views/PartnerNarrativeReport";
import { getSession } from "@/lib/auth";
import { loadAnalyticsBundle } from "@/lib/analytics/data";
import { loadIndicatorTargetsForYear } from "@/lib/analytics/indicator-targets-db";
import {
  loadOutputCumulative,
  loadOutputEntries,
  loadOutputTargets,
} from "@/lib/analytics/output-indicators-db";
import {
  loadOutcomeCumulative,
  loadOutcomeEntries,
  loadOutcomeTargets,
} from "@/lib/analytics/outcome-indicators-db";
import { loadProgramAdjustments } from "@/lib/analytics/program-adjustments-db";
import { prisma } from "@/lib/db";

export default async function PartnerNarrativeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;

  // Quarterly periods only — non-quarterly legacy periods can't be reported.
  const periods = await prisma.reportingPeriod.findMany({
    where: { reportKey: { not: null } },
    orderBy: [{ programYear: "desc" }, { quarter: "desc" }],
    select: {
      id: true,
      label: true,
      slug: true,
      status: true,
      reportKey: true,
      programYear: true,
      quarter: true,
      startDate: true,
      endDate: true,
    },
  });

  if (periods.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-base font-bold text-[#1e3a5f]">
          No quarterly reporting periods yet
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a reporting period under{" "}
          <a
            href="/dashboard/campaigns"
            className="font-semibold text-[#2563a8] hover:underline"
          >
            Campaigns and Links
          </a>{" "}
          before generating a Partner Narrative Report.
        </p>
      </div>
    );
  }

  const selected =
    periods.find((p) => p.id === params.periodId) ?? periods[0]!;

  // Type guard for non-null quarterly fields (filtered above).
  if (
    selected.reportKey === null ||
    selected.programYear === null ||
    selected.quarter === null
  ) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-600">
          Selected period is missing its quarterly identifiers.
        </p>
      </div>
    );
  }

  // Activity bundle for the rollup, plus per-period submission detail.
  const bundle = await loadAnalyticsBundle();
  const submissionsForPeriod = bundle.submissions.filter(
    (s) => s.periodId === selected.id,
  );

  const submissionsWithExtras = await prisma.submission.findMany({
    where: { periodId: selected.id },
    orderBy: { submittedAt: "asc" },
    include: {
      challenges: { orderBy: { orderIndex: "asc" } },
      successStories: { orderBy: { orderIndex: "asc" } },
    },
  });

  // Phase 6 indicator targets (annual, per programYear).
  const indicatorTargets = await loadIndicatorTargetsForYear(
    selected.programYear,
  );

  // Phase 7 output indicators (per programYear + quarter, plus cumulative).
  const [outputTargets, outputEntries, outputCumulative] = await Promise.all([
    loadOutputTargets(selected.programYear),
    loadOutputEntries(selected.programYear, selected.quarter),
    loadOutputCumulative(selected.programYear, selected.quarter),
  ]);

  // Phase 8 outcome indicators.
  const [outcomeTargets, outcomeEntries, outcomeCumulative] = await Promise.all([
    loadOutcomeTargets(selected.programYear),
    loadOutcomeEntries(selected.programYear, selected.quarter),
    loadOutcomeCumulative(selected.programYear, selected.quarter),
  ]);

  // Phase 9 program adjustments (workplan rows, risks, upcoming narrative).
  const programAdjustments = await loadProgramAdjustments(
    selected.programYear,
    selected.quarter,
  );

  return (
    <PartnerNarrativeReport
      periods={periods
        .filter(
          (p): p is typeof p & {
            reportKey: string;
            programYear: number;
            quarter: number;
          } =>
            p.reportKey !== null &&
            p.programYear !== null &&
            p.quarter !== null,
        )
        .map((p) => ({
          id: p.id,
          label: p.label,
          reportKey: p.reportKey,
          programYear: p.programYear,
          quarter: p.quarter,
          status: p.status,
        }))}
      selected={{
        id: selected.id,
        label: selected.label,
        reportKey: selected.reportKey,
        programYear: selected.programYear,
        quarter: selected.quarter,
        status: selected.status,
        startDate: selected.startDate,
        endDate: selected.endDate,
      }}
      activities={bundle.activities}
      submissionsForPeriod={submissionsForPeriod}
      submissionsWithExtras={submissionsWithExtras.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        faculty: s.faculty,
        lessonsLearned: s.lessonsLearned,
        otherInformation: s.otherInformation,
        challenges: s.challenges.map((c) => ({
          pillar: c.pillar,
          challenge: c.challenge,
          contributingFactor: c.contributingFactor,
          responseApproach: c.responseApproach,
        })),
        successStories: s.successStories.map((st) => ({
          consent: st.consent,
          participantName: st.participantName,
          programActivity: st.programActivity,
          location: st.location,
          story: st.story,
          outcomes: st.outcomes,
          photoUrl: st.photoUrl,
        })),
      }))}
      indicatorTargets={indicatorTargets}
      outputs={{
        targets: outputTargets,
        entries: outputEntries,
        cumulative: outputCumulative,
      }}
      outcomes={{
        targets: outcomeTargets,
        entries: outcomeEntries,
        cumulative: outcomeCumulative,
      }}
      programAdjustments={programAdjustments}
      contactEmail={session.email}
    />
  );
}
