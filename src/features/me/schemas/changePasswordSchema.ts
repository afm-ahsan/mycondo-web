import { z } from 'zod';

// Mirrors ChangePasswordCommandValidator on the backend (min/max length, upper/lower/digit) so
// client-side errors match what the server would say — the backend remains authoritative; the
// "differs from current password" rule is enforced there since the client never knows the real
// current password's hash to compare against.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required.' }),
    newPassword: z
      .string()
      .min(12, { message: 'Password must be at least 12 characters.' })
      .max(128, { message: 'Password is too long.' })
      .regex(/[A-Z]/, { message: 'Password must include an uppercase letter.' })
      .regex(/[a-z]/, { message: 'Password must include a lowercase letter.' })
      .regex(/\d/, { message: 'Password must include a digit.' }),
    confirmNewPassword: z.string().min(1, { message: 'Please confirm your new password.' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must differ from your current password.',
    path: ['newPassword'],
  });

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;
