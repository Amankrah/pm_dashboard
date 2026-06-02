import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "nkabom_session";

export type SessionUser = {
  email: string;
  role: "admin" | "viewer";
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = String(payload.email ?? "").toLowerCase();
    const role = payload.role === "admin" ? "admin" : "viewer";
    if (!email) return null;

    const allowed = await prisma.allowedUser.findUnique({ where: { email } });
    if (!allowed) return null;

    return { email, role: allowed.role === "admin" ? "admin" : "viewer" };
  } catch {
    return null;
  }
}

export async function verifyLogin(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const normalized = email.trim().toLowerCase();
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword || password !== appPassword) return null;

  const user = await prisma.allowedUser.findUnique({
    where: { email: normalized },
  });
  if (!user) return null;

  return {
    email: normalized,
    role: user.role === "admin" ? "admin" : "viewer",
  };
}

export function requireAdmin(user: SessionUser | null): user is SessionUser {
  return user?.role === "admin";
}
