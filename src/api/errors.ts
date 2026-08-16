// RFC 9457 ProblemDetails shape — matches what GlobalExceptionMiddleware returns from mycondo-api.
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;
  readonly correlationId?: string;
  readonly raw: ProblemDetails;

  constructor(problem: ProblemDetails, correlationId?: string) {
    super(problem.detail ?? problem.title ?? 'API request failed');
    this.name = 'ApiError';
    this.status = problem.status ?? 0;
    this.title = problem.title ?? 'API error';
    this.detail = problem.detail;
    this.errors = problem.errors;
    this.correlationId = correlationId;
    this.raw = problem;
  }

  get isValidation(): boolean {
    return this.status === 400 && !!this.errors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isServer(): boolean {
    return this.status >= 500;
  }
}

export function toUserMessage(error: unknown): string {
  // RTK Query mutation rejections (`.unwrap()`) throw the base query's error wrapper as-is —
  // `{ status, data, ... }` — not the `ApiError` `baseQueryWithRefresh` attaches as `.data`. Callers
  // that already unwrap via `toApiError` are unaffected; this just makes passing the raw rejection
  // directly behave the same way instead of silently falling through to the generic message below.
  if (error && typeof error === 'object' && 'data' in error && (error as { data?: unknown }).data instanceof ApiError) {
    error = (error as { data: ApiError }).data;
  }
  if (error instanceof ApiError) {
    if (error.isValidation && error.errors) {
      const first = Object.values(error.errors)[0]?.[0];
      return first ?? error.title;
    }
    return error.detail ?? error.title;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
