import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { setAccessToken } from '@/api/baseApi';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
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
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [changePassword, { isLoading }] = useChangePassword();

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  function toggleVisibility(field: string) {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  }

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
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input placeholder={placeholder} type={visibleFields[name] ? 'text' : 'password'} {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() => toggleVisibility(name)}
                    aria-label={visibleFields[name] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    aria-pressed={Boolean(visibleFields[name])}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {visibleFields[name] ? (
                      <EyeOff className="text-muted-foreground" />
                    ) : (
                      <Eye className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
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
