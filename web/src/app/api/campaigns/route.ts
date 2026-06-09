import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatQuarterLabel,
  formatReportKey,
  reportKeySlug,
} from "@/lib/report-period";
import { slugify } from "@/lib/submissions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.reportingPeriod.findMany({
    orderBy: [
      { programYear: "desc" },
      { quarter: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      _count: { select: { submissions: true, invites: true } },
    },
  });

  return NextResponse.json({ campaigns });
}

// Two creation modes. Prefer the quarterly one (programYear + quarter); fall
// back to label-only so admins can still create one-off periods if needed.
const createSchema = z
  .object({
    programYear: z.coerce.number().int().min(1).max(20).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    label: z.string().min(1).optional(),
    slug: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(["open", "closed"]).optional(),
  })
  .refine(
    (v) =>
      (v.programYear !== undefined && v.quarter !== undefined) ||
      (v.label !== undefined && v.label.trim().length > 0),
    {
      message: "Provide either (programYear + quarter) or a label.",
    },
  );

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());

    let programYear: number | null = null;
    let quarter: number | null = null;
    let reportKey: string | null = null;
    let label: string;
    let slug: string;

    if (body.programYear !== undefined && body.quarter !== undefined) {
      programYear = body.programYear;
      quarter = body.quarter;
      reportKey = formatReportKey(programYear, quarter);
      label = body.label?.trim() || formatQuarterLabel(programYear, quarter);
      slug = body.slug?.trim() || reportKeySlug(programYear, quarter);

      // Conflict check: reportKey must be unique across periods.
      const existing = await prisma.reportingPeriod.findUnique({
        where: { reportKey },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Reporting period ${reportKey} already exists.` },
          { status: 409 },
        );
      }
    } else {
      label = body.label!.trim();
      slug = body.slug?.trim() || slugify(label);
    }

    const campaign = await prisma.reportingPeriod.create({
      data: {
        label,
        slug,
        programYear,
        quarter,
        reportKey,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        status: body.status ?? "open",
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create campaign." }, { status: 500 });
  }
}
