import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';
import { useUpdateUser, useUser } from '../api/identityApi';

const editUserSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phoneNumber: optionalBangladeshMobileSchema,
});
type EditUserSchemaType = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Email is intentionally not editable here — it is the login identity; see
 * `User.UpdateProfile`'s doc comment on the backend for the rationale. */
export function EditUserDialog({ userId, open, onOpenChange }: EditUserDialogProps) {
  const { data: user, isLoading: isLoadingUser } = useUser({ id: userId }, { skip: !open });
  const [updateUser, { isLoading: isSaving }] = useUpdateUser();

  const form = useForm<EditUserSchemaType>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { fullName: '', phoneNumber: '' },
  });

  useEffect(() => {
    if (user) {
      form.reset({ fullName: user.fullName, phoneNumber: user.phoneNumber ?? '' });
    }
  }, [user, form]);

  async function onSubmit(values: EditUserSchemaType) {
    try {
      await updateUser({
        id: userId,
        updateUserRequest: { fullName: values.fullName, phoneNumber: values.phoneNumber || null },
      }).unwrap();
      toast.success('User updated.');
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        {isLoadingUser ? (
          <div className="flex items-center gap-2 text-muted-foreground py-6">
            <InlineSpinner /> Loading user...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input value={user?.email ?? ''} disabled readOnly />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Mobile (optional)</FormLabel>
                    <FormControl>
                      <BangladeshPhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
