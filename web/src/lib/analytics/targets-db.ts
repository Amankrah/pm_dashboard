import { prisma } from "@/lib/db";
import type { TargetsMap } from "@/lib/analytics/metrics-core";

export async function loadTargetsFromDb(): Promise<TargetsMap> {
  const rows = await prisma.pillarTarget.findMany();
  const result: TargetsMap = { overall: {}, annual: {}, quarterly: {} };

  for (const row of rows) {
    const val = row.target;
    if (row.periodKey === "overall") {
      result.overall[row.pillar] = val;
    } else if (/^\d{4}$/.test(row.periodKey)) {
      if (!result.annual[row.periodKey]) result.annual[row.periodKey] = {};
      result.annual[row.periodKey][row.pillar] = val;
    } else if (/^\d{4}-Q\d$/.test(row.periodKey)) {
      if (!result.quarterly[row.periodKey])
        result.quarterly[row.periodKey] = {};
      result.quarterly[row.periodKey][row.pillar] = val;
    }
  }
  return result;
}
