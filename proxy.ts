import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: "is there a session cookie at all?".
// Real session validation and permission checks happen in every API route
// (lib/api/handler.ts → lib/services/*) — never rely on this alone.
const PUBLIC_PAGES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // API routes answer 401 JSON themselves; redirecting them to an HTML page would break clients.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const hasSession = request.cookies.has("sid");
  const isPublic = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!hasSession && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
