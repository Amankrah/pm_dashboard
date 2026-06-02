import { PILLARS } from "@/lib/constants";
import type { FlatActivity } from "@/lib/analytics/types";

export function countByStatus(acts: FlatActivity[]) {
  return {
    total: acts.length,
    completed: acts.filter((a) => a.status === "Completed").length,
    ongoing: acts.filter((a) => a.status === "Ongoing").length,
    planned: acts.filter((a) => a.status === "Planned").length,
  };
}

export function pillarStats(acts: FlatActivity[], pillar: string) {
  const pa = acts.filter((a) => a.themes.includes(pillar));
  const done = pa.filter((a) => a.status === "Completed").length;
  const going = pa.filter((a) => a.status === "Ongoing").length;
  const plan = pa.filter((a) => a.status === "Planned").length;
  const tot = pa.length;
  const pct = tot > 0 ? Math.round((done / tot) * 100) : 0;
  return { pa, done, going, plan, tot, pct };
}

export type TargetsMap = {
  overall: Record<string, number>;
  annual: Record<string, Record<string, number>>;
  quarterly: Record<string, Record<string, number>>;
};

export function getTarget(
  targets: TargetsMap,
  pillar: string,
  periodKey: string,
) {
  if (!periodKey || periodKey === "all")
    return targets.overall[pillar] ?? 0;
  if (/^\d{4}$/.test(periodKey))
    return targets.annual[periodKey]?.[pillar] ?? 0;
  if (/^\d{4}-Q\d$/.test(periodKey))
    return targets.quarterly[periodKey]?.[pillar] ?? 0;
  return 0;
}
