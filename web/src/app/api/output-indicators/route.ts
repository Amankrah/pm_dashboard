import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import {
  loadOutputCumulative,
  loadOutputEntries,
  loadOutputTargets,
  saveOutputEntries,
  saveOutputTargets,
} from "@/lib/analytics/output-indicators-db";

// One combined endpoint that returns the full state needed by the admin
// page in a single round-trip: annual targets for the year, quarterly
// values for the selected quarter, and YTD cumulative through that
// quarter. POST accepts two batched arrays so admins can save the whole
// page in one click.

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
    loadOutputTargets(programYear),
    loadOutputEntries(programYear, quarter),
    loadOutputCumulative(programYear, quarter),
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
      await saveOutputTargets(body.programYear, body.targets);
    }
    if (body.entries && body.entries.length > 0) {
      await saveOutputEntries(
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
      loadOutputTargets(body.programYear),
      loadOutputEntries(body.programYear, body.quarter),
      loadOutputCumulative(body.programYear, body.quarter),
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
