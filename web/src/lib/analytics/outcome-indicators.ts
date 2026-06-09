// Phase 8: Outcome Level Progress vocabulary.
//
// Outcomes are cross-pillar in the docx: rows are outcome metrics,
// columns are the four pillars. We store one value per (pillar,
// indicator, programYear, quarter) so admins can attribute different
// values to different pillars when appropriate. The form renders a
// per-pillar block matching the Phase 7 pattern for consistency.
//
// "parent" groups related disaggregations (Youth in Work + Females +
// IDPs + PWDs). "unit" tells the form whether to render a % or $ suffix.

import type { Pillar } from "@/lib/constants";

export type OutcomeIndicatorUnit = "count" | "percent";

export type OutcomeIndicatorMeta = {
  key: string;
  parent: string;
  label: string;
  unit: OutcomeIndicatorUnit;
};

// One canonical list. Each indicator is keyed by indicator string (not
// per-pillar); the admin form lets the same indicator be filled per pillar.
export const OUTCOME_INDICATORS: readonly OutcomeIndicatorMeta[] = [
  {
    key: "yiw_total",
    parent: "Youth in Work",
    label: "Total",
    unit: "count",
  },
  {
    key: "yiw_females",
    parent: "Youth in Work",
    label: "Females",
    unit: "count",
  },
  {
    key: "yiw_idps",
    parent: "Youth in Work",
    label: "IDPs",
    unit: "count",
  },
  {
    key: "yiw_pwds",
    parent: "Youth in Work",
    label: "PWDs",
    unit: "count",
  },
  {
    key: "enterprises_revenue_increase_pct",
    parent: "Enterprise outcomes",
    label: "Supported enterprises reporting revenue increases",
    unit: "percent",
  },
  {
    key: "enterprises_offerings_change_pct",
    parent: "Enterprise outcomes",
    label: "Enterprises reporting a change in offerings or markets",
    unit: "percent",
  },
  {
    key: "youth_dignified_jobs_pct",
    parent: "Youth jobs quality",
    label: "Youth in dignified and fulfilling jobs",
    unit: "percent",
  },
] as const;

export type OutcomeIndicatorKey = (typeof OUTCOME_INDICATORS)[number]["key"];

const BY_KEY = new Map(OUTCOME_INDICATORS.map((m) => [m.key, m]));
export function outcomeIndicatorMeta(
  key: string,
): OutcomeIndicatorMeta | undefined {
  return BY_KEY.get(key);
}

// Group the canonical list by parent for the form's two-level layout.
export type OutcomeIndicatorGroup = {
  parent: string;
  rows: OutcomeIndicatorMeta[];
};

export function outcomeIndicatorGroups(): OutcomeIndicatorGroup[] {
  const groups: OutcomeIndicatorGroup[] = [];
  const byParent = new Map<string, OutcomeIndicatorGroup>();
  for (const m of OUTCOME_INDICATORS) {
    let g = byParent.get(m.parent);
    if (!g) {
      g = { parent: m.parent, rows: [] };
      byParent.set(m.parent, g);
      groups.push(g);
    }
    g.rows.push(m);
  }
  return groups;
}

// Re-export to colocate with consumers; the indicator vocabulary is
// pillar-agnostic but the storage row keys by (pillar, indicator).
export type OutcomePillar = Pillar;
