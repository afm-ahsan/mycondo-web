import { describe, expect, it } from 'vitest';
import { ApiError, toApiError, toUserMessage } from './errors';

describe('toUserMessage', () => {
  it('returns the detail for an already-unwrapped ApiError', () => {
    const error = new ApiError({ status: 409, title: 'Conflict', detail: 'This resident already owns this flat.' });
    expect(toUserMessage(error)).toBe('This resident already owns this flat.');
  });

  // Reproduces the Grant/End ownership bug: `.unwrap()` on a rejected RTK Query mutation throws the
  // base query's error wrapper (`{ status, data: ApiError }`) as-is, not the ApiError itself — calling
  // toUserMessage directly on that wrapper (as FlatOwnerListPage's handleAddFlat/handleConfirm did)
  // used to fall through to the generic fallback instead of surfacing the real conflict detail.
  it('unwraps an RTK Query rejection wrapper carrying an ApiError as .data', () => {
    const apiError = new ApiError({
      status: 409,
      title: 'Conflict',
      detail: 'This resident already has an active ownership relationship with this flat.',
    });
    const rtkQueryRejection = { status: 409, data: apiError };
    expect(toUserMessage(rtkQueryRejection)).toBe(
      'This resident already has an active ownership relationship with this flat.',
    );
  });

  it('falls back to a plain Error message', () => {
    expect(toUserMessage(new Error('network down'))).toBe('network down');
  });

  it('falls back to a generic message for an unrecognized value', () => {
    expect(toUserMessage({ status: 500 })).toBe('Something went wrong. Please try again.');
    expect(toUserMessage(null)).toBe('Something went wrong. Please try again.');
  });

  it('prefers the first validation error over the title', () => {
    const error = new ApiError({
      status: 400,
      title: 'Validation failed',
      errors: { FullName: ['Full name is required.'] },
    });
    expect(toUserMessage(error)).toBe('Full name is required.');
  });

  // baseQueryWithRefresh/platformBaseQueryWithRefresh attach `apiError.toPayload()` — a plain object,
  // not the ApiError instance — to avoid Redux's non-serializable-value warning. toUserMessage must
  // reconstruct the same behavior from that plain shape.
  it('unwraps an RTK Query rejection wrapper carrying a serialized ApiError payload as .data', () => {
    const payload = new ApiError({
      status: 409,
      title: 'Conflict',
      detail: 'This resident already owns this flat.',
    }).toPayload();
    expect(toUserMessage({ status: 409, data: payload })).toBe('This resident already owns this flat.');
  });
});

describe('toApiError', () => {
  it('reconstructs an ApiError from a serialized payload without ever needing a class instance in state', () => {
    const payload = new ApiError({ status: 400, title: 'Validation failed', errors: { Email: ['Email is required.'] } }, 'corr-1').toPayload();

    expect(payload).not.toBeInstanceOf(ApiError);
    expect(() => JSON.stringify(payload)).not.toThrow();

    const apiError = toApiError({ status: 400, data: payload });
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError?.isValidation).toBe(true);
    expect(apiError?.correlationId).toBe('corr-1');
  });

  it('returns null for a rejection with no recognizable error data', () => {
    expect(toApiError({ status: 500, data: undefined })).toBeNull();
    expect(toApiError(null)).toBeNull();
  });
});
