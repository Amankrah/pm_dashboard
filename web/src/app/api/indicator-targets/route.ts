import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import {
  loadIndicatorTargetsForYear,
  saveIndicatorTargetsForYear,
  type IndicatorTargetMap,
} from "@/lib/analytics/indicator-targets-db";
import type { IndicatorKey } from "@/lib/analytics/indicator-rollup";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get("programYear");
  if (!yearStr) {
    return NextResponse.json(
      { error: "programYear query param required" },
      { status: 400 },
    );
  }
  const programYear = Number(yearStr);
  if (!Number.isInteger(programYear) || programYear < 1 || programYear > 20) {
    return NextResponse.json(
      { error: "programYear must be an integer between 1 and 20" },
      { status: 400 },
    );
  }
  const targets = await loadIndicatorTargetsForYear(programYear);
  return NextResponse.json({ programYear, targets });
}

const saveSchema = z.object({
  programYear: z.coerce.number().int().min(1).max(20),
  values: z.record(z.string(), z.coerce.number().int().min(0).max(10_000_000)),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = saveSchema.parse(await request.json());
    await saveIndicatorTargetsForYear(
      body.programYear,
      body.values as IndicatorTargetMap,
    );
    const targets = await loadIndicatorTargetsForYear(body.programYear);
    return NextResponse.json({
      ok: true,
      programYear: body.programYear,
      targets,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
}

// Re-export so the route file is self-contained — the IndicatorKey union is
// not used directly at runtime, this just keeps the type wired to the
// shared vocabulary for any future schema-level checks.
export type { IndicatorKey };
