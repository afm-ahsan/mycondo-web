import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Copy, Eye, EyeOff, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';
import { useCreateUser } from '../api/identityApi';

const createUserSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  email: z.string().min(1, { message: 'Email is required.' }).email({ message: 'Enter a valid email address.' }),
  phoneNumber: optionalBangladeshMobileSchema,
  initialPassword: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => !value || (value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)),
      { message: 'Password must be at least 12 characters and include an uppercase letter, a lowercase letter, and a digit.' },
    ),
});
type CreateUserSchemaType = z.infer<typeof createUserSchema>;

/** Add User — creates a user in the caller's own tenant. Reuses the RHF+Zod / server-error-mapping
 * pattern from CreateTenantPage.tsx, scoped down for this simpler entity. */
export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [createUser, { isLoading }] = useCreateUser();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const form = useForm<CreateUserSchemaType>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', phoneNumber: '', initialPassword: '' },
  });

  async function onSubmit(values: CreateUserSchemaType) {
    try {
      const result = await createUser({
        createUserCommand: {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber || null,
          initialPassword: values.initialPassword || null,
        },
      }).unwrap();

      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
      } else {
        toast.success(`User "${values.fullName}" created.`);
        closeAndReset();
      }
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
    setTemporaryPassword(null);
    setPasswordVisible(false);
    form.reset();
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    toast.success('Temporary password copied.');
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

        {temporaryPassword ? (
          <div className="space-y-4">
            <Alert variant="success" appearance="light">
              <AlertIcon>
                <CheckCircle2 />
              </AlertIcon>
              <AlertTitle>
                User created. Share this temporary password with them securely — it will not be
                shown again.
              </AlertTitle>
            </Alert>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                type={passwordVisible ? 'text' : 'password'}
                value={temporaryPassword}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                mode="icon"
                onClick={() => setPasswordVisible(!passwordVisible)}
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              >
                {passwordVisible ? <EyeOff /> : <Eye />}
              </Button>
              <Button type="button" variant="outline" mode="icon" onClick={copyTemporaryPassword} aria-label="Copy password">
                <Copy />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={closeAndReset}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>Mobile (optional)</FormLabel>
                    <FormControl>
                      <BangladeshPhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial password (optional)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={passwordVisible ? 'text' : 'password'}
                          placeholder="Leave blank to generate one automatically"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        aria-pressed={passwordVisible}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      >
                        {passwordVisible ? (
                          <EyeOff className="text-muted-foreground" />
                        ) : (
                          <Eye className="text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      If left blank, a temporary password is generated and shown once so you can
                      relay it to the user.
                    </FormDescription>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
