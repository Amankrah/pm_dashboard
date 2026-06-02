import { randomBytes } from "node:crypto";

export function generateInviteToken() {
  return randomBytes(18).toString("base64url");
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function inviteLink(token: string) {
  return `${appBaseUrl()}/f/${token}`;
}
