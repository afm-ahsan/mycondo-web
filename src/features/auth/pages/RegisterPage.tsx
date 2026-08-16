import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, toUserMessage } from '@/api/errors';
import { setAccessToken } from '@/api/baseApi';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { PasswordInput } from '@/components/shared/PasswordInput';
import { PasswordPolicyInfo } from '@/components/shared/PasswordPolicyInfo';
import { PasswordRequirementsChecklist } from '@/components/shared/PasswordRequirementsChecklist';
import { useAppDispatch } from '@/store/hooks';
import { sessionStarted } from '@/store/slices/authSlice';
import { toAuthUser, useRegister, useResolveTenantBySlug } from '../api/authApi';
import { persistTenantId } from '../lib/tenantSession';
import { registerSchema, type RegisterSchemaType } from '../schemas/registerSchema';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  const [resolveTenantBySlug, { isFetching: isResolvingTenant }] = useResolveTenantBySlug();
  const [register, { isLoading: isRegistering }] = useRegister();
  const isSubmitting = isResolvingTenant || isRegistering;

  const form = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantSlug: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });
  const password = form.watch('password');

  async function onSubmit(values: RegisterSchemaType) {
    setError(null);

    try {
      const tenant = await resolveTenantBySlug({ slug: values.tenantSlug }).unwrap();

      const response = await register({
        registerUserCommand: {
          tenantId: tenant.tenantId,
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phoneNumber: values.phoneNumber || null,
        },
      }).unwrap();

      setAccessToken(response.accessToken);
      persistTenantId(response.user.tenantId);
      dispatch(sessionStarted(toAuthUser(response.user)));

      navigate('/');
    } catch (err) {
      const apiError = toApiError(err);

      if (apiError?.isNotFound) {
        form.setError('tenantSlug', { message: 'Organization not found.' });
        return;
      }
      if (apiError?.isConflict) {
        form.setError('email', { message: 'An account with this email already exists.' });
        return;
      }
      if (apiError?.isValidation && apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          const fieldName = field.toLowerCase() as keyof RegisterSchemaType;
          if (fieldName in form.getValues()) {
            form.setError(fieldName, { message: messages[0] });
          }
        }
        return;
      }

      setError(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="block w-full space-y-5">
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">Register for your organization on MyCondo.</p>
        </div>

        {error && (
          <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="tenantSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <FormControl>
                <Input placeholder="your-organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
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
                <Input placeholder="Your email" {...field} />
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
              <FormLabel>Phone number (optional)</FormLabel>
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
            <FormItem>
              <div className="flex items-center gap-1.5">
                <FormLabel>Password</FormLabel>
                <PasswordPolicyInfo />
              </div>
              <FormControl>
                <PasswordInput placeholder="Choose a password" label="password" {...field} />
              </FormControl>
              {fieldState.isDirty && <PasswordRequirementsChecklist value={password} />}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Re-enter your password" label="confirm password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <InlineSpinner /> Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}

function toApiError(err: unknown): ApiError | null {
  if (err && typeof err === 'object' && 'data' in err && err.data instanceof ApiError) {
    return err.data;
  }
  return null;
}
