import type { FlatActivity, PeriodOption } from "@/lib/analytics/types";

export function getActDate(a: FlatActivity) {
  return a.startDate || a.submission.submissionDate || "";
}

export function parsePeriod(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth();
  const q = Math.floor(m / 3) + 1;
  return {
    yearStr: String(y),
    quarterStr: `${y}-Q${q}`,
    monthStr: `${y}-${String(m + 1).padStart(2, "0")}`,
  };
}

export function filterByPeriod(acts: FlatActivity[], period: string) {
  if (!period || period === "all") return acts;
  return acts.filter((a) => {
    const p = parsePeriod(getActDate(a));
    if (!p) return false;
    if (/^\d{4}-Q\d$/.test(period)) return p.quarterStr === period;
    if (/^\d{4}-\d{2}$/.test(period)) return p.monthStr === period;
    if (/^\d{4}$/.test(period)) return p.yearStr === period;
    return true;
  });
}

export function periodLabel(v: string) {
  if (!v || v === "all") return "All Time";
  if (/^\d{4}$/.test(v)) return `Year ${v}`;
  if (/^\d{4}-Q\d$/.test(v)) {
    const [y, q] = v.split("-");
    return `${q} ${y}`;
  }
  if (/^\d{4}-\d{2}$/.test(v)) {
    const [y, m] = v.split("-");
    const mn = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ][parseInt(m, 10) - 1];
    return `${mn} ${y}`;
  }
  if (v === "overall") return "Overall";
  return v;
}

export function buildPeriodOptions(acts: FlatActivity[]): PeriodOption[] {
  const years = new Set<string>();
  const quarters = new Set<string>();

  acts.forEach((a) => {
    const p = parsePeriod(getActDate(a));
    if (p) {
      years.add(p.yearStr);
      quarters.add(p.quarterStr);
    }
  });

  const opts: PeriodOption[] = [{ value: "all", label: "All Time" }];
  [...years].sort().forEach((y) => {
    opts.push({ value: y, label: `${y} (Full Year)` });
    (["Q1", "Q2", "Q3", "Q4"] as const).forEach((q) => {
      const qs = `${y}-${q}`;
      if (quarters.has(qs)) opts.push({ value: qs, label: `  ${q} ${y}` });
    });
  });
  return opts;
}
