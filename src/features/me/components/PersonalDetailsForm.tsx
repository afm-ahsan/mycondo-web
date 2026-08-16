import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { useAppDispatch } from '@/store/hooks';
import { profileUpdated } from '@/store/slices/authSlice';
import { useUpdateMyProfile } from '@/features/auth/api/authApi';
import { personalDetailsSchema, type PersonalDetailsSchemaType } from '../schemas/personalDetailsSchema';

interface PersonalDetailsFormProps {
  email: string;
  fullName: string;
  phoneNumber: string | null;
}

export function PersonalDetailsForm({ email, fullName, phoneNumber }: PersonalDetailsFormProps) {
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateMyProfile();

  const form = useForm<PersonalDetailsSchemaType>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: { fullName, phoneNumber: phoneNumber ?? '' },
  });

  useUnsavedChangesGuard(form.formState.isDirty);

  async function onSubmit(values: PersonalDetailsSchemaType) {
    try {
      const profile = await updateProfile({
        updateMyProfileCommand: {
          fullName: values.fullName,
          phoneNumber: values.phoneNumber ? values.phoneNumber : null,
        },
      }).unwrap();

      dispatch(profileUpdated({ name: profile.fullName }));
      form.reset({ fullName: profile.fullName, phoneNumber: profile.phoneNumber ?? '' });
      toast.success('Profile updated successfully.');
    } catch (err) {
      const apiError = toApiError(err);
      const mapped = applyApiErrorToForm(form, apiError);
      if (!mapped) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={email} disabled readOnly aria-describedby="profile-email-hint" />
          <p id="profile-email-hint" className="text-xs text-muted-foreground">
            Your email is your login identity and can&apos;t be changed here.
          </p>
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <BangladeshPhoneInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={!form.formState.isDirty || isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <InlineSpinner /> Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
