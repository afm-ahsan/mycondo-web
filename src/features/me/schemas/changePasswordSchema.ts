import { z } from 'zod';
import { passwordSchema } from '@/lib/validation/password';

// Mirrors the backend's shared MustBeAStrongPassword rule (min/max length, upper/lower/digit/special
// char) so client-side errors match what the server would say — the backend remains authoritative; the
// "differs from current password" rule is enforced there since the client never knows the real
// current password's hash to compare against.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required.' }),
    newPassword: passwordSchema,
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
