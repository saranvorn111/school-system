import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { isDuplicateKeyError } from "@/db";
import { currentUserOrThrow } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { ApiError, badRequest, forbidden, invalid, notFound } from "./errors";

type Params = Record<string, string | string[] | undefined>;
type RouteContext = { params: Promise<Params> };

type Ctx = { req: NextRequest; params: Params };
type AuthedCtx = Ctx & { user: CurrentUser };

/** Return `created(x)` from a handler to answer 201 instead of 200. */
export class Created {
  constructor(public data: unknown) {}
}
export const created = (data: unknown) => new Created(data);

export function zodFieldErrors(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

function toResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(error) },
      { status: 422 },
    );
  }
  if (isDuplicateKeyError(error)) {
    return NextResponse.json({ error: "A record with the same unique value already exists." }, { status: 409 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/**
 * Cookies are sent automatically by the browser, so a state-changing request
 * from another website could ride on the user's session (CSRF). Browsers
 * always send `Origin` on such requests — reject it when it isn't ours.
 */
function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) throw forbidden("Cross-site request blocked.");
}

function wrap<C>(build: (req: NextRequest, params: Params) => Promise<C>, fn: (ctx: C) => Promise<unknown>) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      assertSameOrigin(req);
      const ctx = await build(req, await context.params);
      const result = await fn(ctx);
      if (result instanceof Created) return NextResponse.json(result.data, { status: 201 });
      if (result instanceof Response) return result;
      if (result === undefined) return new NextResponse(null, { status: 204 });
      return NextResponse.json(result);
    } catch (error) {
      return toResponse(error);
    }
  };
}

/** Route handler for logged-in users. Unauthenticated requests get 401. */
export function route(fn: (ctx: AuthedCtx) => Promise<unknown>) {
  return wrap(async (req, params) => ({ req, params, user: await currentUserOrThrow() }), fn);
}

/** Route handler that doesn't need a session (login). */
export function publicRoute(fn: (ctx: Ctx) => Promise<unknown>) {
  return wrap(async (req, params) => ({ req, params }), fn);
}

// ── Request helpers ─────────────────────────────────────────────

export async function readBody<T extends ZodType>(req: NextRequest, schema: T) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest("Request body must be JSON.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw invalid("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  return parsed.data;
}

export function readQuery<T extends ZodType>(req: NextRequest, schema: T) {
  const parsed = schema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw invalid("Invalid query parameters.", zodFieldErrors(parsed.error));
  return parsed.data;
}

/** Positive integer id from a dynamic segment like [id]. */
export function idParam(params: Params, name = "id") {
  const value = Number(params[name]);
  if (!Number.isInteger(value) || value <= 0) throw notFound();
  return value;
}
