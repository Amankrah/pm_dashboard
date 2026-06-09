// Phase 7: Output Level Progress vocabulary.
//
// Each entry is a single row in the docx's Section 4 Output Level table.
// Many rows are disaggregations of a parent indicator (e.g. "Number of
// Courses Developed" has Full-time / Short / PhD); the parent string is
// preserved here so the admin UI and the report generator can render the
// usual two-level grouping (parent label, indented sub-rows).
//
// The "unit" hint helps the admin form display "%" suffix on percentage
// indicators and "$" on monetary indicators. Defaults to a plain count.

import type { Pillar } from "@/lib/constants";

export type OutputIndicatorUnit = "count" | "percent" | "currency";

export type OutputIndicatorMeta = {
  key: string;
  pillar: Pillar;
  parent: string;
  label: string;
  unit: OutputIndicatorUnit;
};

export const OUTPUT_INDICATORS: readonly OutputIndicatorMeta[] = [
  // Education
  {
    key: "edu_courses_full_time",
    pillar: "Education",
    parent: "Number of courses or programs developed",
    label: "Full-time",
    unit: "count",
  },
  {
    key: "edu_courses_short",
    pillar: "Education",
    parent: "Number of courses or programs developed",
    label: "Short courses",
    unit: "count",
  },
  {
    key: "edu_courses_phd",
    pillar: "Education",
    parent: "Number of courses or programs developed",
    label: "PhD courses",
    unit: "count",
  },
  {
    key: "edu_youth_formal_female",
    pillar: "Education",
    parent: "Number of youth who participated in formal education",
    label: "Female",
    unit: "count",
  },
  {
    key: "edu_youth_formal_refugee_idp",
    pillar: "Education",
    parent: "Number of youth who participated in formal education",
    label: "Refugee or IDP",
    unit: "count",
  },
  {
    key: "edu_youth_formal_disability",
    pillar: "Education",
    parent: "Number of youth who participated in formal education",
    label: "Youth with disability",
    unit: "count",
  },
  {
    key: "edu_youth_formal_phd",
    pillar: "Education",
    parent: "Number of youth who participated in formal education",
    label: "PhDs or postdoctoral",
    unit: "count",
  },

  // Access
  {
    key: "acc_youth_completed_female",
    pillar: "Access",
    parent: "Number of youth who completed formal education",
    label: "Female",
    unit: "count",
  },
  {
    key: "acc_youth_completed_refugee_idp",
    pillar: "Access",
    parent: "Number of youth who completed formal education",
    label: "Refugee or IDP",
    unit: "count",
  },
  {
    key: "acc_youth_completed_disability",
    pillar: "Access",
    parent: "Number of youth who completed formal education",
    label: "Youth with disability",
    unit: "count",
  },
  {
    key: "acc_youth_support_female",
    pillar: "Access",
    parent: "Number of youth who received educational support",
    label: "Female",
    unit: "count",
  },
  {
    key: "acc_youth_support_refugee_idp",
    pillar: "Access",
    parent: "Number of youth who received educational support",
    label: "Refugee or IDP",
    unit: "count",
  },
  {
    key: "acc_youth_support_disability",
    pillar: "Access",
    parent: "Number of youth who received educational support",
    label: "Youth with disability",
    unit: "count",
  },
  {
    key: "acc_scholars_internship_pct",
    pillar: "Access",
    parent: "Percentage of scholars participating in programme activities",
    label: "Internship",
    unit: "percent",
  },
  {
    key: "acc_scholars_career_counselling_pct",
    pillar: "Access",
    parent: "Percentage of scholars participating in programme activities",
    label: "Work readiness or career counselling",
    unit: "percent",
  },

  // Entrepreneurship
  {
    key: "ent_enterprises_finance_female_led",
    pillar: "Entrepreneurship",
    parent: "Number of enterprises accessing financial products",
    label: "Female-led",
    unit: "count",
  },
  {
    key: "ent_enterprises_finance_refugee_led",
    pillar: "Entrepreneurship",
    parent: "Number of enterprises accessing financial products",
    label: "Refugee or IDP led",
    unit: "count",
  },
  {
    key: "ent_enterprises_finance_disability_led",
    pillar: "Entrepreneurship",
    parent: "Number of enterprises accessing financial products",
    label: "Youth-with-disability led",
    unit: "count",
  },
  {
    key: "ent_youth_training_female",
    pillar: "Entrepreneurship",
    parent: "Number of youth in training opportunities",
    label: "Female",
    unit: "count",
  },
  {
    key: "ent_youth_training_refugee_idp",
    pillar: "Entrepreneurship",
    parent: "Number of youth in training opportunities",
    label: "Refugee or IDP",
    unit: "count",
  },
  {
    key: "ent_youth_training_disability",
    pillar: "Entrepreneurship",
    parent: "Number of youth in training opportunities",
    label: "Youth with disability",
    unit: "count",
  },
  {
    key: "ent_enterprises_bds_count",
    pillar: "Entrepreneurship",
    parent: "Number of enterprises or groups accessing business development services",
    label: "Total enterprises receiving BDS",
    unit: "count",
  },
  {
    key: "ent_financial_services_value",
    pillar: "Entrepreneurship",
    parent: "Total value of financial services received by enterprises",
    label: "Total value (USD)",
    unit: "currency",
  },
] as const;

export type OutputIndicatorKey = (typeof OUTPUT_INDICATORS)[number]["key"];

// Helper: lookup metadata by key.
const BY_KEY = new Map(OUTPUT_INDICATORS.map((m) => [m.key, m]));
export function outputIndicatorMeta(key: string): OutputIndicatorMeta | undefined {
  return BY_KEY.get(key);
}

// Helper: group entries by parent indicator within a pillar. Returns the
// parent strings in the order they first appear, with their disaggregation
// rows.
export type OutputIndicatorGroup = {
  parent: string;
  rows: OutputIndicatorMeta[];
};

export function outputIndicatorsByPillar(pillar: Pillar): OutputIndicatorGroup[] {
  const groups: OutputIndicatorGroup[] = [];
  const byParent = new Map<string, OutputIndicatorGroup>();
  for (const m of OUTPUT_INDICATORS) {
    if (m.pillar !== pillar) continue;
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
