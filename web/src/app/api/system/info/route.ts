import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/tokens";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowedCount = await prisma.allowedUser.count();

  return NextResponse.json({
    signedInAs: session.email,
    role: session.role,
    allowedCount,
    appUrl: appBaseUrl(),
  });
}
