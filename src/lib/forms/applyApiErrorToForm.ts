import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { ApiError } from '@/api/errors';

/** Unwraps an RTK Query rejection into the `ApiError` `baseQueryWithRefresh` attaches as `.data`. */
export function toApiError(err: unknown): ApiError | null {
  if (err && typeof err === 'object' && 'data' in err && (err as { data?: unknown }).data instanceof ApiError) {
    return (err as { data: ApiError }).data;
  }
  return null;
}

interface ApplyApiErrorToFormOptions<TFieldValues extends FieldValues> {
  /** Field to attach a conflict (409) message to, e.g. a uniqueness violation. */
  conflictField?: Path<TFieldValues>;
  conflictMessage?: string;
}

/**
 * Maps a rejected mutation's `ApiError` onto React Hook Form field errors, generalizing the
 * conflict/validation handling first written ad hoc in CreateTenantPage.tsx. Validation error keys
 * from the backend are PascalCase (matching C# property names, e.g. `FullName`); this converts them
 * to the form's camelCase field names before calling `form.setError`.
 *
 * Returns `true` if the error was mapped onto the form; `false` means the caller should fall back to
 * a page-level message via `toUserMessage(apiError ?? err)`.
 */
export function applyApiErrorToForm<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  apiError: ApiError | null,
  options: ApplyApiErrorToFormOptions<TFieldValues> = {},
): boolean {
  if (apiError?.isConflict && options.conflictField) {
    form.setError(options.conflictField, {
      message: options.conflictMessage ?? apiError.detail ?? apiError.title,
    });
    return true;
  }

  if (apiError?.isValidation && apiError.errors) {
    let mapped = false;
    for (const [field, messages] of Object.entries(apiError.errors)) {
      const fieldName = (field.charAt(0).toLowerCase() + field.slice(1)) as Path<TFieldValues>;
      if (fieldName in form.getValues()) {
        form.setError(fieldName, { message: messages[0] });
        mapped = true;
      }
    }
    if (mapped) return true;
  }

  return false;
}
