// Phase 5: aggregates faculty submissions into the Partner Narrative
// Report's Overall Indicator Performance table.
//
// The docx wants four columns per indicator:
//   Annual Target | Previous Qtr | Current Qtr | Cumulative (Year)
//
// "Previous Qtr" is the programme quarter immediately before the selected
// one (Y2Q3 -> Y2Q2; Y2Q1 -> Y1Q4). "Cumulative" sums every quarter in
// the same programYear up to and including the current one. Annual Target
// will populate from the per-indicator targets in Phase 6; for now it
// stays null and the table renders a placeholder dash.

import { PILLARS } from "@/lib/constants";
import type { FlatActivity } from "@/lib/analytics/types";

export type IndicatorKey =
  | "outreach"
  | "outreachWomen"
  | "participantsTotal"
  | "participantsYouth"
  | "participantsWomen"
  | "participantsRural"
  | "participantsUrban"
  | "participantsPeriUrban"
  | "participantsDisability"
  | "participantsRefugeeIdp"
  | "participantsYiW"
  | "participantsYiWWomen"
  | "coursesDeveloped"
  | "businessesWithBds";

export const INDICATOR_ROWS: { key: IndicatorKey; label: string; indent?: boolean }[] = [
  { key: "outreach", label: "Outreach" },
  { key: "outreachWomen", label: "Outreach (young women)", indent: true },
  { key: "participantsTotal", label: "Total Participants" },
  { key: "participantsYouth", label: "Youth (15 to 35)", indent: true },
  { key: "participantsWomen", label: "Women", indent: true },
  { key: "participantsRural", label: "Rural", indent: true },
  { key: "participantsUrban", label: "Urban", indent: true },
  { key: "participantsPeriUrban", label: "Peri-Urban", indent: true },
  { key: "participantsDisability", label: "Youth with Disabilities", indent: true },
  { key: "participantsRefugeeIdp", label: "Refugees or IDPs", indent: true },
  { key: "participantsYiW", label: "Youth in Work" },
  { key: "participantsYiWWomen", label: "Youth in Work (young women)", indent: true },
  { key: "coursesDeveloped", label: "Number of courses or programs developed" },
  { key: "businessesWithBds", label: "Number of businesses supported with BDS services" },
];

export type RollupCell = number;
export type RollupRow = {
  key: IndicatorKey;
  label: string;
  indent: boolean;
  annualTarget: number | null;
  previousQtr: RollupCell;
  currentQtr: RollupCell;
  cumulativeYtd: RollupCell;
};

// "Previous quarter" maps Y2Q3 -> Y2Q2; Y2Q1 -> Y1Q4. Returns null when
// programYear or quarter is missing (legacy data) or there is no prior
// quarter (e.g. Y1Q1).
export function previousReportKey(programYear: number, quarter: number): string | null {
  if (quarter > 1) return `Y${programYear}Q${quarter - 1}`;
  if (programYear > 1) return `Y${programYear - 1}Q4`;
  return null;
}

// Sum a participant count across activities, treating NULL as 0 but
// preserving "explicitly zero" semantics for individual rows elsewhere.
function sumCount(
  activities: FlatActivity[],
  pick: (a: FlatActivity) => number | null | undefined,
): number {
  let total = 0;
  for (const a of activities) {
    const v = pick(a);
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

function countActivities(
  activities: FlatActivity[],
  predicate: (a: FlatActivity) => boolean,
): number {
  let n = 0;
  for (const a of activities) if (predicate(a)) n += 1;
  return n;
}

// All indicator totals for a given activity set.
function aggregate(activities: FlatActivity[]) {
  const total = sumCount(activities, (a) => a.counts.participantsTotal);
  const rural = sumCount(
    activities.filter((a) => a.localeType === "Rural"),
    (a) => a.counts.participantsTotal,
  );
  const urban = sumCount(
    activities.filter((a) => a.localeType === "Urban"),
    (a) => a.counts.participantsTotal,
  );
  const peri = sumCount(
    activities.filter((a) => a.localeType === "Peri-Urban"),
    (a) => a.counts.participantsTotal,
  );
  return {
    outreach: sumCount(activities, (a) => a.counts.outreachCount),
    outreachWomen: sumCount(activities, (a) => a.counts.participantsWomen),
    participantsTotal: total,
    participantsYouth: sumCount(activities, (a) => a.counts.participantsYouth),
    participantsWomen: sumCount(activities, (a) => a.counts.participantsWomen),
    participantsRural: rural,
    participantsUrban: urban,
    participantsPeriUrban: peri,
    participantsDisability: sumCount(activities, (a) => a.counts.participantsDisability),
    participantsRefugeeIdp: sumCount(activities, (a) => a.counts.participantsRefugeeIdp),
    participantsYiW: sumCount(activities, (a) => a.counts.participantsYiW),
    participantsYiWWomen: sumCount(activities, (a) => a.counts.participantsYiWWomen),
    coursesDeveloped: countActivities(activities, (a) => a.activityType === "Course"),
    businessesWithBds: countActivities(
      activities,
      (a) =>
        a.activityType === "Mentorship" ||
        (a.themes.includes("Entrepreneurship") && a.activityType === "Workshop"),
    ),
  } satisfies Record<IndicatorKey, number>;
}

// Activities scoped to a single reporting period (by reportKey on the
// submission). When reportKey is null, returns an empty list — legacy data
// without a quarter assignment is excluded from rollups.
function activitiesForReportKey(
  activities: FlatActivity[],
  reportKey: string | null,
): FlatActivity[] {
  if (!reportKey) return [];
  return activities.filter((a) => a.submission.periodReportKey === reportKey);
}

// Activities cumulative-to-date within a programme year: every quarter in
// programYear with quarter <= currentQuarter.
function activitiesCumulative(
  activities: FlatActivity[],
  programYear: number,
  upToQuarter: number,
): FlatActivity[] {
  return activities.filter((a) => {
    const y = a.submission.periodProgramYear;
    const q = a.submission.periodQuarter;
    if (y === null || q === null) return false;
    return y === programYear && q <= upToQuarter;
  });
}

export type RollupContext = {
  reportKey: string;
  programYear: number;
  quarter: number;
};

// Phase 6: optional per-indicator annual targets. Keys missing from the
// map fall back to null (renders as a dash on the page).
export type IndicatorTargetLookup = Partial<Record<IndicatorKey, number>>;

export function buildIndicatorRollup(
  allActivities: FlatActivity[],
  ctx: RollupContext,
  targets: IndicatorTargetLookup = {},
): {
  rows: RollupRow[];
  previousKey: string | null;
  currentCount: number;
  cumulativeCount: number;
} {
  const previousKey = previousReportKey(ctx.programYear, ctx.quarter);
  const current = activitiesForReportKey(allActivities, ctx.reportKey);
  const previous = activitiesForReportKey(allActivities, previousKey);
  const cumulative = activitiesCumulative(allActivities, ctx.programYear, ctx.quarter);

  const cur = aggregate(current);
  const prv = aggregate(previous);
  const cum = aggregate(cumulative);

  const rows: RollupRow[] = INDICATOR_ROWS.map((meta) => ({
    key: meta.key,
    label: meta.label,
    indent: meta.indent ?? false,
    annualTarget: targets[meta.key] ?? null,
    previousQtr: prv[meta.key],
    currentQtr: cur[meta.key],
    cumulativeYtd: cum[meta.key],
  }));

  return {
    rows,
    previousKey,
    currentCount: current.length,
    cumulativeCount: cumulative.length,
  };
}

// Per-pillar activity counts for the same three-column view. Used in the
// Programme Achievements section preview on the quarterly page.
export type PillarActivityRollupRow = {
  pillar: string;
  previousQtr: number;
  currentQtr: number;
  cumulativeYtd: number;
};

export function buildPillarActivityRollup(
  allActivities: FlatActivity[],
  ctx: RollupContext,
): PillarActivityRollupRow[] {
  const previousKey = previousReportKey(ctx.programYear, ctx.quarter);
  const current = activitiesForReportKey(allActivities, ctx.reportKey);
  const previous = activitiesForReportKey(allActivities, previousKey);
  const cumulative = activitiesCumulative(allActivities, ctx.programYear, ctx.quarter);

  return PILLARS.map((pillar) => ({
    pillar,
    previousQtr: previous.filter((a) => a.themes.includes(pillar)).length,
    currentQtr: current.filter((a) => a.themes.includes(pillar)).length,
    cumulativeYtd: cumulative.filter((a) => a.themes.includes(pillar)).length,
  }));
}
