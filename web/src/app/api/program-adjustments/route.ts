import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import {
  loadProgramAdjustments,
  saveProgramAdjustments,
} from "@/lib/analytics/program-adjustments-db";

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
  const state = await loadProgramAdjustments(programYear, quarter);
  return NextResponse.json({ programYear, quarter, ...state });
}

const workplanSchema = z.object({
  initialPlan: z.string(),
  change: z.string(),
  reason: z.string().nullable().optional(),
  implications: z.string().nullable().optional(),
});

const riskSchema = z.object({
  description: z.string(),
  response: z.string().nullable().optional(),
});

const saveSchema = z.object({
  programYear: z.coerce.number().int().min(1).max(20),
  quarter: z.coerce.number().int().min(1).max(4),
  workplan: z.array(workplanSchema).optional(),
  risks: z.array(riskSchema).optional(),
  upcomingActivities: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  try {
    const body = saveSchema.parse(await request.json());
    await saveProgramAdjustments(body.programYear, body.quarter, {
      workplan: (body.workplan ?? []).map((w) => ({
        initialPlan: w.initialPlan,
        change: w.change,
        reason: w.reason ?? null,
        implications: w.implications ?? null,
      })),
      risks: (body.risks ?? []).map((r) => ({
        description: r.description,
        response: r.response ?? null,
      })),
      upcomingActivities: body.upcomingActivities ?? null,
    });
    const state = await loadProgramAdjustments(body.programYear, body.quarter);
    return NextResponse.json({
      ok: true,
      programYear: body.programYear,
      quarter: body.quarter,
      ...state,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
}
