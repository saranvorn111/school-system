import "server-only";
import { headers } from "next/headers";

/** IP and user agent of the current request, for login history and audit records. */
export async function getClientInfo() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64),
    userAgent: (h.get("user-agent") ?? "").slice(0, 255) || null,
  };
}
