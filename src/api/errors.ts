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

  /**
   * A plain, JSON-serializable twin of this instance — what `baseQueryWithRefresh`/
   * `platformBaseQueryWithRefresh` attach as `.data` instead of the class instance itself. Redux's
   * default `serializableCheck` middleware flags any class instance (its `isPlainObject` walks the
   * prototype chain looking for a bare `Object.prototype`, which `ApiError extends Error` never has),
   * so an `ApiError` must never be dispatched into RTK Query/Redux state directly — only reconstructed
   * from this shape at the point of use via `toApiError`/`toUserMessage`.
   */
  toPayload(): ApiErrorPayload {
    return {
      status: this.status,
      title: this.title,
      detail: this.detail,
      errors: this.errors,
      correlationId: this.correlationId,
      raw: this.raw,
    };
  }
}

export interface ApiErrorPayload {
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
  raw: ProblemDetails;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'title' in value &&
    'raw' in value
  );
}

/** Unwraps an RTK Query rejection into the `ApiError` `baseQueryWithRefresh` attaches as `.data`. */
export function toApiError(err: unknown): ApiError | null {
  if (!err || typeof err !== 'object' || !('data' in err)) {
    return null;
  }
  const data = (err as { data?: unknown }).data;
  if (data instanceof ApiError) {
    return data;
  }
  if (isApiErrorPayload(data)) {
    return new ApiError(data.raw, data.correlationId);
  }
  return null;
}

export function toUserMessage(error: unknown): string {
  // RTK Query mutation rejections (`.unwrap()`) throw the base query's error wrapper as-is —
  // `{ status, data, ... }` — not the `ApiError` `baseQueryWithRefresh` attaches as `.data`. Callers
  // that already unwrap via `toApiError` are unaffected; this just makes passing the raw rejection
  // directly behave the same way instead of silently falling through to the generic message below.
  const apiError = toApiError(error) ?? (error instanceof ApiError ? error : null);
  if (apiError) {
    if (apiError.isValidation && apiError.errors) {
      const first = Object.values(apiError.errors)[0]?.[0];
      return first ?? apiError.title;
    }
    return apiError.detail ?? apiError.title;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
