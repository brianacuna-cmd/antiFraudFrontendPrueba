export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export class AuthError extends ApiError {
  constructor(message: string, body?: unknown) {
    super(message, 401, body)
    this.name = 'AuthError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, body?: unknown) {
    super(message, 400, body)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, body?: unknown) {
    super(message, 404, body)
    this.name = 'NotFoundError'
  }
}

export function mapErrorResponse(status: number, body: unknown): ApiError {
  const message = extractMessage(body) ?? `Request failed with status ${status}`
  if (status === 401) return new AuthError(message, body)
  if (status === 400) return new ValidationError(message, body)
  if (status === 404) return new NotFoundError(message, body)
  return new ApiError(message, status, body)
}

function extractMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return undefined
}
