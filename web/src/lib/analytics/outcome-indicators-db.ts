// Phase 8: read/write helpers for OutcomeIndicatorTarget and
// OutcomeIndicatorEntry. Same pattern as output-indicators-db.

import { prisma } from "@/lib/db";

export type OutcomeTargetMap = Record<string, number>;
export type OutcomeEntryMap = Record<
  string,
  { value: number; comments: string | null }
>;

export async function loadOutcomeTargets(
  programYear: number,
): Promise<OutcomeTargetMap> {
  const rows = await prisma.outcomeIndicatorTarget.findMany({
    where: { programYear },
  });
  const out: OutcomeTargetMap = {};
  for (const r of rows) out[`${r.pillar}::${r.indicator}`] = r.target;
  return out;
}

export async function saveOutcomeTargets(
  programYear: number,
  values: Array<{ pillar: string; indicator: string; target: number }>,
) {
  await prisma.$transaction(
    values.map((v) =>
      prisma.outcomeIndicatorTarget.upsert({
        where: {
          pillar_indicator_programYear: {
            pillar: v.pillar,
            indicator: v.indicator,
            programYear,
          },
        },
        create: {
          pillar: v.pillar,
          indicator: v.indicator,
          programYear,
          target: Math.max(0, Math.floor(v.target ?? 0)),
        },
        update: { target: Math.max(0, Math.floor(v.target ?? 0)) },
      }),
    ),
  );
}

export async function loadOutcomeEntries(
  programYear: number,
  quarter: number,
): Promise<OutcomeEntryMap> {
  const rows = await prisma.outcomeIndicatorEntry.findMany({
    where: { programYear, quarter },
  });
  const out: OutcomeEntryMap = {};
  for (const r of rows) {
    out[`${r.pillar}::${r.indicator}`] = {
      value: r.value,
      comments: r.comments,
    };
  }
  return out;
}

export async function loadOutcomeCumulative(
  programYear: number,
  upToQuarter: number,
): Promise<OutcomeTargetMap> {
  const rows = await prisma.outcomeIndicatorEntry.findMany({
    where: { programYear, quarter: { lte: upToQuarter } },
  });
  const out: OutcomeTargetMap = {};
  for (const r of rows) {
    const key = `${r.pillar}::${r.indicator}`;
    out[key] = (out[key] ?? 0) + r.value;
  }
  return out;
}

export async function saveOutcomeEntries(
  programYear: number,
  quarter: number,
  values: Array<{
    pillar: string;
    indicator: string;
    value: number;
    comments: string | null;
  }>,
) {
  await prisma.$transaction(
    values.map((v) =>
      prisma.outcomeIndicatorEntry.upsert({
        where: {
          pillar_indicator_programYear_quarter: {
            pillar: v.pillar,
            indicator: v.indicator,
            programYear,
            quarter,
          },
        },
        create: {
          pillar: v.pillar,
          indicator: v.indicator,
          programYear,
          quarter,
          value: Math.max(0, Math.floor(v.value ?? 0)),
          comments: v.comments,
        },
        update: {
          value: Math.max(0, Math.floor(v.value ?? 0)),
          comments: v.comments,
        },
      }),
    ),
  );
}
