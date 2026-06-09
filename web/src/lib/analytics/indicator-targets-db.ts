// Phase 6: read/write helpers for IndicatorTarget rows. Returns the
// targets for a single programYear as a flat dictionary keyed by the
// IndicatorKey vocabulary used by indicator-rollup.

import { prisma } from "@/lib/db";
import type { IndicatorKey } from "@/lib/analytics/indicator-rollup";

export type IndicatorTargetMap = Partial<Record<IndicatorKey, number>>;

export async function loadIndicatorTargetsForYear(
  programYear: number,
): Promise<IndicatorTargetMap> {
  const rows = await prisma.indicatorTarget.findMany({
    where: { programYear },
  });
  const out: IndicatorTargetMap = {};
  for (const r of rows) {
    out[r.indicator as IndicatorKey] = r.target;
  }
  return out;
}

// Bulk-upsert targets for a single year. Values <= 0 stored as 0 (the docx
// uses 0 / blank interchangeably; we normalise to 0 for sortability).
export async function saveIndicatorTargetsForYear(
  programYear: number,
  values: IndicatorTargetMap,
) {
  const entries = Object.entries(values) as [IndicatorKey, number][];
  await prisma.$transaction(
    entries.map(([indicator, raw]) => {
      const target = Math.max(0, Math.floor(raw ?? 0));
      return prisma.indicatorTarget.upsert({
        where: { indicator_programYear: { indicator, programYear } },
        create: { indicator, programYear, target },
        update: { target },
      });
    }),
  );
}
