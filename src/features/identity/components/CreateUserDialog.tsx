import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { PasswordPolicyInfo } from '@/components/shared/PasswordPolicyInfo';
import { PasswordRequirementsChecklist } from '@/components/shared/PasswordRequirementsChecklist';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { bangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';
import { passwordSchema } from '@/lib/validation/password';
import { useCreateUser } from '../api/identityApi';

const createUserSchema = z
  .object({
    fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
    email: z.string().min(1, { message: 'Email is required.' }).email({ message: 'Enter a valid email address.' }),
    phoneNumber: bangladeshMobileSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Please confirm the password.' }),
    status: z.enum(['active', 'inactive']),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
type CreateUserSchemaType = z.infer<typeof createUserSchema>;

/** Add User — creates a user in the caller's own tenant. Reuses the RHF+Zod / server-error-mapping
 * pattern from CreateTenantPage.tsx, scoped down for this simpler entity. */
export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [createUser, { isLoading }] = useCreateUser();

  const form = useForm<CreateUserSchemaType>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', status: 'active' },
  });
  const password = form.watch('password');

  async function onSubmit(values: CreateUserSchemaType) {
    try {
      await createUser({
        createUserCommand: {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: values.password,
          isActive: values.status === 'active',
        },
      }).unwrap();

      toast.success(`User "${values.fullName}" created.`);
      closeAndReset();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'email',
        conflictMessage: 'A user with this email already exists.',
      });
      if (!handled) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  function closeAndReset() {
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon /> Add User
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Rahman" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <BangladeshPhoneInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem required>
                  <div className="flex items-center gap-1.5">
                    <FormLabel>Password</FormLabel>
                    <PasswordPolicyInfo />
                  </div>
                  <FormControl>
                    <PasswordInput label="password" {...field} />
                  </FormControl>
                  {fieldState.isDirty && password && <PasswordRequirementsChecklist value={password} />}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <PasswordInput label="confirm password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
