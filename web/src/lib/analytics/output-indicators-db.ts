// Phase 7: read/write helpers for OutputIndicatorTarget and
// OutputIndicatorEntry. Annual targets are loaded by programYear;
// quarterly entries are loaded by (programYear, quarter). Cumulative YTD
// for a programYear is the sum across every quarter row that year.

import { prisma } from "@/lib/db";

export type OutputTargetMap = Record<string, number>;
export type OutputEntryMap = Record<
  string,
  { value: number; comments: string | null }
>;

export async function loadOutputTargets(
  programYear: number,
): Promise<OutputTargetMap> {
  const rows = await prisma.outputIndicatorTarget.findMany({
    where: { programYear },
  });
  const out: OutputTargetMap = {};
  for (const r of rows) out[`${r.pillar}::${r.indicator}`] = r.target;
  return out;
}

export async function saveOutputTargets(
  programYear: number,
  values: Array<{ pillar: string; indicator: string; target: number }>,
) {
  await prisma.$transaction(
    values.map((v) =>
      prisma.outputIndicatorTarget.upsert({
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

export async function loadOutputEntries(
  programYear: number,
  quarter: number,
): Promise<OutputEntryMap> {
  const rows = await prisma.outputIndicatorEntry.findMany({
    where: { programYear, quarter },
  });
  const out: OutputEntryMap = {};
  for (const r of rows) {
    out[`${r.pillar}::${r.indicator}`] = {
      value: r.value,
      comments: r.comments,
    };
  }
  return out;
}

// Cumulative YTD: sum value across all quarters for this (pillar,
// indicator, programYear). Returns a map keyed the same way.
export async function loadOutputCumulative(
  programYear: number,
  upToQuarter: number,
): Promise<OutputTargetMap> {
  const rows = await prisma.outputIndicatorEntry.findMany({
    where: { programYear, quarter: { lte: upToQuarter } },
  });
  const out: OutputTargetMap = {};
  for (const r of rows) {
    const key = `${r.pillar}::${r.indicator}`;
    out[key] = (out[key] ?? 0) + r.value;
  }
  return out;
}

export async function saveOutputEntries(
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
      prisma.outputIndicatorEntry.upsert({
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
