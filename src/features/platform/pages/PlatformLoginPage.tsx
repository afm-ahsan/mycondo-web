import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { toApiError, toUserMessage } from '@/api/errors';
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
import { platformSessionStarted } from '@/store/slices/platformAuthSlice';
import { toPlatformAuthUser, usePlatformLogin } from '../api/platformAuthApi';
import { markPlatformSessionActive } from '../lib/platformSession';
import { platformLoginSchema, type PlatformLoginSchemaType } from '../schemas/platformLoginSchema';

/**
 * Deliberately a separate page/route from LoginPage — no Organization field, posts to
 * /api/v1/platform/auth/login, and stores its session under platformAuthSlice, never authSlice. See
 * mycondo-docs ADR-019. Not linked from the tenant /login page — reached only by direct URL, matching
 * its intended audience (MyCondo's own operations staff, not tenant customers).
 */
export function PlatformLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [platformLogin, { isLoading: isLoggingIn }] = usePlatformLogin();

  const form = useForm<PlatformLoginSchemaType>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: PlatformLoginSchemaType) {
    setError(null);

    try {
      const response = await platformLogin(values).unwrap();

      setPlatformAccessToken(response.accessToken);
      markPlatformSessionActive();
      dispatch(platformSessionStarted(toPlatformAuthUser(response.user)));

      navigate(searchParams.get('next') ?? '/platform/dashboard');
    } catch (err) {
      const apiError = toApiError(err);

      if (apiError?.isValidation && apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          const fieldName = field.toLowerCase() as keyof PlatformLoginSchemaType;
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
          <h1 className="text-2xl font-semibold tracking-tight">Platform Sign In</h1>
          <p className="text-sm text-muted-foreground">MyCondo platform administration.</p>
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

        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <InlineSpinner /> Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </Form>
  );
}
