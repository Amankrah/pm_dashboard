// Phase 9: read/write helpers for the three Program Adjustments tables.
// Save replaces all rows for a (programYear, quarter) so the admin form
// can use a simple "send the whole list" pattern.

import { prisma } from "@/lib/db";

export type WorkplanAdjustmentRow = {
  initialPlan: string;
  change: string;
  reason: string | null;
  implications: string | null;
};

export type RiskRow = {
  description: string;
  response: string | null;
};

export type ProgramAdjustmentsState = {
  workplan: WorkplanAdjustmentRow[];
  risks: RiskRow[];
  upcomingActivities: string | null;
};

export async function loadProgramAdjustments(
  programYear: number,
  quarter: number,
): Promise<ProgramAdjustmentsState> {
  const [workplan, risks, narrative] = await Promise.all([
    prisma.workplanAdjustment.findMany({
      where: { programYear, quarter },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.risk.findMany({
      where: { programYear, quarter },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.adjustmentsNarrative.findUnique({
      where: { programYear_quarter: { programYear, quarter } },
    }),
  ]);

  return {
    workplan: workplan.map((w) => ({
      initialPlan: w.initialPlan,
      change: w.change,
      reason: w.reason,
      implications: w.implications,
    })),
    risks: risks.map((r) => ({
      description: r.description,
      response: r.response,
    })),
    upcomingActivities: narrative?.upcomingActivities ?? null,
  };
}

export async function saveProgramAdjustments(
  programYear: number,
  quarter: number,
  state: ProgramAdjustmentsState,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Replace rows wholesale. The admin form sends the full list each time
    // so the delete-then-create pattern is simpler than diffing.
    await tx.workplanAdjustment.deleteMany({ where: { programYear, quarter } });
    await tx.risk.deleteMany({ where: { programYear, quarter } });

    if (state.workplan.length > 0) {
      await tx.workplanAdjustment.createMany({
        data: state.workplan
          .filter((w) => w.initialPlan.trim() || w.change.trim())
          .map((w, idx) => ({
            programYear,
            quarter,
            initialPlan: w.initialPlan.trim(),
            change: w.change.trim(),
            reason: w.reason?.trim() || null,
            implications: w.implications?.trim() || null,
            orderIndex: idx,
          })),
      });
    }

    if (state.risks.length > 0) {
      await tx.risk.createMany({
        data: state.risks
          .filter((r) => r.description.trim())
          .map((r, idx) => ({
            programYear,
            quarter,
            description: r.description.trim(),
            response: r.response?.trim() || null,
            orderIndex: idx,
          })),
      });
    }

    await tx.adjustmentsNarrative.upsert({
      where: { programYear_quarter: { programYear, quarter } },
      create: {
        programYear,
        quarter,
        upcomingActivities: state.upcomingActivities?.trim() || null,
      },
      update: {
        upcomingActivities: state.upcomingActivities?.trim() || null,
      },
    });
  });
}
