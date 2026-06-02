import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inviteLink, generateInviteToken } from "@/lib/tokens";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invites = await prisma.formInvite.findMany({
    where: { periodId: id },
    orderBy: { createdAt: "desc" },
    include: { submission: { select: { id: true, fullName: true } } },
  });

  return NextResponse.json({
    invites: invites.map((inv) => ({
      ...inv,
      link: inviteLink(inv.token),
    })),
  });
}

const createInviteSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  faculty: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  count: z.number().int().min(1).max(50).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id: periodId } = await params;
  const period = await prisma.reportingPeriod.findUnique({ where: { id: periodId } });
  if (!period) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  try {
    const body = createInviteSchema.parse(await request.json());
    const count = body.count ?? 1;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const created = [];
    for (let i = 0; i < count; i++) {
      const invite = await prisma.formInvite.create({
        data: {
          periodId,
          token: generateInviteToken(),
          email: body.email ?? null,
          fullName: body.fullName ?? null,
          faculty: body.faculty ?? null,
          expiresAt,
        },
      });
      created.push({ ...invite, link: inviteLink(invite.token) });
    }

    return NextResponse.json({ invites: created }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create invites." }, { status: 500 });
  }
}
