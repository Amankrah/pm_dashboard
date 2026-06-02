import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyLogin } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const user = await verifyLogin(body.email, body.password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password, or email not on allowlist." },
        { status: 401 },
      );
    }
    await createSession(user);
    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
