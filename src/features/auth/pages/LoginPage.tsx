import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, toUserMessage } from '@/api/errors';
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
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { useAppDispatch } from '@/store/hooks';
import { sessionStarted } from '@/store/slices/authSlice';
import { setAccessToken } from '@/api/baseApi';
import { toAuthUser, useLogin, useResolveTenantBySlug } from '../api/authApi';
import { persistTenantId } from '../lib/tenantSession';
import { loginSchema, type LoginSchemaType } from '../schemas/loginSchema';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resolveTenantBySlug, { isFetching: isResolvingTenant }] = useResolveTenantBySlug();
  const [login, { isLoading: isLoggingIn }] = useLogin();
  const isSubmitting = isResolvingTenant || isLoggingIn;

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenantSlug: '', email: '', password: '' },
  });

  async function onSubmit(values: LoginSchemaType) {
    setError(null);

    try {
      const tenant = await resolveTenantBySlug({ slug: values.tenantSlug }).unwrap();

      const response = await login({
        loginCommand: { tenantId: tenant.tenantId, email: values.email, password: values.password },
      }).unwrap();

      setAccessToken(response.accessToken);
      persistTenantId(response.user.tenantId);
      dispatch(sessionStarted(toAuthUser(response.user)));

      navigate(searchParams.get('next') ?? '/');
    } catch (err) {
      const apiError = toApiError(err);

      if (apiError?.isNotFound) {
        form.setError('tenantSlug', { message: 'Organization not found.' });
        return;
      }
      if (apiError?.isValidation && apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          const fieldName = field.toLowerCase() as keyof LoginSchemaType;
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
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">Welcome back to MyCondo.</p>
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
                <Input placeholder="Your organization name" {...field} />
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Your password"
                    type={passwordVisible ? 'text' : 'password'}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <InlineSpinner /> Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create one
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
