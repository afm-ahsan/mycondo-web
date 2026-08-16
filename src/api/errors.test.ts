import { describe, expect, it } from 'vitest';
import { ApiError, toUserMessage } from './errors';

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
});
