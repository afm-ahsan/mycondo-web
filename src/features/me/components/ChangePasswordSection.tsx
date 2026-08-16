import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { setAccessToken } from '@/api/baseApi';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { PasswordPolicyInfo } from '@/components/shared/PasswordPolicyInfo';
import { PasswordRequirementsChecklist } from '@/components/shared/PasswordRequirementsChecklist';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useAppDispatch } from '@/store/hooks';
import { sessionEnded } from '@/store/slices/authSlice';
import { useChangePassword } from '@/features/auth/api/authApi';
import { changePasswordSchema, type ChangePasswordSchemaType } from '../schemas/changePasswordSchema';

const FIELDS: { name: keyof ChangePasswordSchemaType; label: string; placeholder: string }[] = [
  { name: 'currentPassword', label: 'Current Password', placeholder: 'Your current password' },
  { name: 'newPassword', label: 'New Password', placeholder: 'Your new password' },
  { name: 'confirmNewPassword', label: 'Confirm New Password', placeholder: 'Re-enter your new password' },
];

export function ChangePasswordSection() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePassword();

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });
  const newPassword = form.watch('newPassword');

  async function onSubmit(values: ChangePasswordSchemaType) {
    try {
      await changePassword({
        changePasswordCommand: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      }).unwrap();

      // The backend revokes every outstanding refresh token on a successful password change — the
      // frontend session must follow suit rather than silently keep working off the current access
      // token until it naturally expires.
      setAccessToken(null);
      dispatch(sessionEnded());
      toast.success('Password changed successfully. Please sign in again.');
      navigate('/login');
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError?.isForbidden) {
        form.setError('currentPassword', { message: 'Current password is incorrect.' });
        return;
      }
      const mapped = applyApiErrorToForm(form, apiError);
      if (!mapped) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {FIELDS.map(({ name, label, placeholder }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <FormItem>
                {name === 'newPassword' ? (
                  <div className="flex items-center gap-1.5">
                    <FormLabel>{label}</FormLabel>
                    <PasswordPolicyInfo />
                  </div>
                ) : (
                  <FormLabel>{label}</FormLabel>
                )}
                <FormControl>
                  <PasswordInput placeholder={placeholder} label={label.toLowerCase()} {...field} />
                </FormControl>
                {name === 'newPassword' && fieldState.isDirty && (
                  <PasswordRequirementsChecklist value={newPassword} />
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <InlineSpinner /> Changing password...
              </span>
            ) : (
              'Change Password'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
