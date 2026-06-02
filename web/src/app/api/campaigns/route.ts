import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/submissions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.reportingPeriod.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true, invites: true } },
    },
  });

  return NextResponse.json({ campaigns });
}

const createSchema = z.object({
  label: z.string().min(1),
  slug: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const slug = body.slug?.trim() || slugify(body.label);

    const campaign = await prisma.reportingPeriod.create({
      data: {
        label: body.label,
        slug,
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
