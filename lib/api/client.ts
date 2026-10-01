/**
 * Browser-side client for our /api routes. Every page and form talks to the
 * server through here, so errors are handled the same way everywhere.
 */

/** JSON turns Dates into strings; this mirrors that on the server's return types. */
export type Json<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Json<U>[]
    : T extends object
      ? { [K in keyof T]: Json<T[K]> }
      : T;

/** Response type of a service function as the browser receives it. */
export type ApiData<F extends (...args: never[]) => unknown> = Json<Awaited<ReturnType<F>>>;

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T = unknown>(path: string, options: { method?: Method; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  });

  if (res.status === 401 && !path.startsWith("/api/auth/login")) {
    // Session expired or revoked: go back to the login page and come back here afterwards.
    // A full page load (not router.push) also throws away cached data from the old session.
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${next}`;
    throw new ApiClientError(401, "Your session has ended. Please log in again.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(res.status, data.error ?? `Request failed (${res.status}).`, data.fieldErrors);
  }
  return data as T;
}

/** Build a query string, skipping empty values. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : "";
}
