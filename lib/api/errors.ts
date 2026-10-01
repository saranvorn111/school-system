/**
 * Errors thrown by services. The API layer turns them into JSON responses
 * with the matching HTTP status (see lib/api/handler.ts).
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fieldErrors?: Record<string, string[]>) =>
  new ApiError(400, message, fieldErrors);
export const unauthorized = (message = "Please log in.") => new ApiError(401, message);
export const forbidden = (message = "You don't have permission for this action.") => new ApiError(403, message);
export const notFound = (message = "Not found.") => new ApiError(404, message);
/** The request is valid but conflicts with the current state (duplicate, full, locked…). */
export const conflict = (message: string) => new ApiError(409, message);
export const invalid = (message: string, fieldErrors?: Record<string, string[]>) => new ApiError(422, message, fieldErrors);
