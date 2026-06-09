import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import {
  loadOutcomeCumulative,
  loadOutcomeEntries,
  loadOutcomeTargets,
  saveOutcomeEntries,
  saveOutcomeTargets,
} from "@/lib/analytics/outcome-indicators-db";

// Single combined endpoint that returns the full state for the admin
// page in one round-trip. Same shape as /api/output-indicators.

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const programYear = Number(searchParams.get("programYear"));
  const quarter = Number(searchParams.get("quarter"));
  if (
    !Number.isInteger(programYear) ||
    programYear < 1 ||
    programYear > 20 ||
    !Number.isInteger(quarter) ||
    quarter < 1 ||
    quarter > 4
  ) {
    return NextResponse.json(
      { error: "programYear (1-20) and quarter (1-4) query params required" },
      { status: 400 },
    );
  }
  const [targets, entries, cumulative] = await Promise.all([
    loadOutcomeTargets(programYear),
    loadOutcomeEntries(programYear, quarter),
    loadOutcomeCumulative(programYear, quarter),
  ]);
  return NextResponse.json({
    programYear,
    quarter,
    targets,
    entries,
    cumulative,
  });
}

const indicatorEntry = z.object({
  pillar: z.string().min(1),
  indicator: z.string().min(1),
});

// Percentages clamp to 0..100; counts and amounts use the wider integer
// range. The schema accepts the wider range and we leave clamping to the
// UI / consumer — storage is just a non-negative integer.
const targetSchema = indicatorEntry.extend({
  target: z.coerce.number().int().min(0).max(10_000_000),
});

const entrySchema = indicatorEntry.extend({
  value: z.coerce.number().int().min(0).max(10_000_000),
  comments: z.string().nullable().optional(),
});

const saveSchema = z.object({
  programYear: z.coerce.number().int().min(1).max(20),
  quarter: z.coerce.number().int().min(1).max(4),
  targets: z.array(targetSchema).optional(),
  entries: z.array(entrySchema).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  try {
    const body = saveSchema.parse(await request.json());
    if (body.targets && body.targets.length > 0) {
      await saveOutcomeTargets(body.programYear, body.targets);
    }
    if (body.entries && body.entries.length > 0) {
      await saveOutcomeEntries(
        body.programYear,
        body.quarter,
        body.entries.map((e) => ({
          pillar: e.pillar,
          indicator: e.indicator,
          value: e.value,
          comments: e.comments ?? null,
        })),
      );
    }
    const [targets, entries, cumulative] = await Promise.all([
      loadOutcomeTargets(body.programYear),
      loadOutcomeEntries(body.programYear, body.quarter),
      loadOutcomeCumulative(body.programYear, body.quarter),
    ]);
    return NextResponse.json({
      ok: true,
      programYear: body.programYear,
      quarter: body.quarter,
      targets,
      entries,
      cumulative,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
}
