/**
 * Errors that map cleanly onto HTTP responses.
 *
 * `code` mirrors the PostgreSQL SQLSTATE so the frontend can branch on the
 * same codes it used with Supabase (e.g. 23505 = unique_violation).
 */
export class HttpError extends Error {
  constructor(statusCode, message, code = "ERROR") {
    super(message)
    this.name = "HttpError"
    this.statusCode = statusCode
    this.code = code
  }
}

export const badRequest = (message, code = "BAD_REQUEST") => new HttpError(400, message, code)
export const unauthorized = (message = "Authentication required", code = "UNAUTHENTICATED") =>
  new HttpError(401, message, code)
export const forbidden = (message = "Not allowed", code = "FORBIDDEN") => new HttpError(403, message, code)
export const notFound = (message = "Not found", code = "NOT_FOUND") => new HttpError(404, message, code)
export const conflict = (message, code = "CONFLICT") => new HttpError(409, message, code)

/** Translate a pg error into an HttpError (or rethrow unknowns). */
export function fromPgError(err) {
  switch (err?.code) {
    case "23505": // unique_violation
      return conflict(dedupeConstraintMessage(err), "23505")
    case "23503": // foreign_key_violation
      return badRequest("Referenced record does not exist", "23503")
    case "23502": // not_null_violation
      return badRequest("A required field was missing", "23502")
    case "22P02": // invalid_text_representation (e.g. malformed uuid)
      return badRequest("Invalid identifier supplied", "22P02")
    case "42P01": // undefined_table
      return new HttpError(500, "Database schema is missing. Run `pnpm db:setup`.", "42P01")
    default:
      return err
  }
}

function dedupeConstraintMessage(err) {
  const detail = err.detail || ""
  const match = detail.match(/Key \(([^)]+)\)=/ )
  if (match) return `${match[1]} is already taken`
  return "That record already exists"
}

/** Wrap an async fastify handler so thrown errors reach the error handler. */
export function route(handler) {
  return async (request, reply) => {
    try {
      return await handler(request, reply)
    } catch (err) {
      throw fromPgError(err)
    }
  }
}
