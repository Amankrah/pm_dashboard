import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSubmissionFromPayload } from "@/lib/submissions";
import { importSubmissionSchema } from "@/lib/validation";

const importBodySchema = z.object({
  periodId: z.string().min(1),
  submissions: z.array(importSubmissionSchema).min(1),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = importBodySchema.parse(await request.json());
    const period = await prisma.reportingPeriod.findUnique({
      where: { id: body.periodId },
    });
    if (!period) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    let imported = 0;
    let skipped = 0;

    for (const item of body.submissions) {
      const dup = await prisma.submission.findFirst({
        where: {
          periodId: body.periodId,
          email: item.respondent.email,
          submissionDate: item.respondent.submission_date,
        },
      });
      if (dup) {
        skipped++;
        continue;
      }

      await createSubmissionFromPayload(body.periodId, null, item);
      imported++;
    }

    return NextResponse.json({ imported, skipped });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
