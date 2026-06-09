// Helpers for the Nkabom programme's quarterly reporting cadence.
//
// reportKey is the canonical, sortable, machine-readable identifier
// ("Y2Q3"). programYear and quarter are the underlying integers. label is
// the human-friendly string shown in the UI ("Year 2 Quarter 3").
//
// The Mastercard Foundation Partner Narrative Report template uses YnQq
// notation in its General Information section, so reportKey lines up with
// the docx exactly.

export const QUARTERS = [1, 2, 3, 4] as const;
export type Quarter = (typeof QUARTERS)[number];

export function isValidQuarter(n: unknown): n is Quarter {
  return n === 1 || n === 2 || n === 3 || n === 4;
}

export function isValidProgramYear(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 20;
}

export function formatReportKey(programYear: number, quarter: number) {
  return `Y${programYear}Q${quarter}`;
}

export function formatQuarterLabel(programYear: number, quarter: number) {
  return `Year ${programYear} Quarter ${quarter}`;
}

export function reportKeySlug(programYear: number, quarter: number) {
  return `y${programYear}q${quarter}`;
}

// Sort order: programYear ASC then quarter ASC. Returns < 0 if a precedes b.
export function compareReportKeys(
  a: { programYear: number | null; quarter: number | null },
  b: { programYear: number | null; quarter: number | null },
) {
  const ya = a.programYear ?? 0;
  const yb = b.programYear ?? 0;
  if (ya !== yb) return ya - yb;
  const qa = a.quarter ?? 0;
  const qb = b.quarter ?? 0;
  return qa - qb;
}

// Parse "Y2Q3" back into {programYear, quarter}. Returns null on bad input.
export function parseReportKey(
  key: string,
): { programYear: number; quarter: number } | null {
  const m = /^Y(\d{1,2})Q([1-4])$/i.exec(key.trim());
  if (!m) return null;
  return { programYear: Number(m[1]), quarter: Number(m[2]) };
}
