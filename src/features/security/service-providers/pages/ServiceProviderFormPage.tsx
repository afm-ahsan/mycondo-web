import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { PageHeader } from '@/components/shared/PageHeader';
import { useRegisterServiceProvider } from '../api/serviceProvidersApi';
import { PROVIDER_TYPES } from '../lib/constants';
import {
  registerServiceProviderSchema,
  type RegisterServiceProviderSchemaType,
} from '../schemas/registerServiceProviderSchema';

// Create-only, matching Domestic Staff/Vehicle/Guest's precedent — no update endpoint for the
// profile itself.
export function ServiceProviderFormPage() {
  const navigate = useNavigate();
  const [registerProvider, { isLoading }] = useRegisterServiceProvider();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterServiceProviderSchemaType>({
    resolver: zodResolver(registerServiceProviderSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      providerType: undefined,
      serviceDescription: '',
      identityDocumentType: '',
      identityDocumentNumber: '',
    },
  });

  async function onSubmit(values: RegisterServiceProviderSchemaType) {
    setError(null);

    try {
      const provider = await registerProvider({
        registerServiceProviderCommand: {
          fullName: values.fullName,
          phone: values.phone,
          providerType: values.providerType,
          serviceDescription: values.serviceDescription || null,
          identityDocumentType: values.identityDocumentType || null,
          identityDocumentNumber: values.identityDocumentNumber || null,
        },
      }).unwrap();

      toast.success(
        `"${provider.fullName}" added to the service provider directory.`,
      );
      navigate('/security/service-providers');
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Register Service Provider"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Service Providers', path: '/security/service-providers' },
          { label: 'Register' },
        ]}
      />
      <Card>
        <CardContent className="max-w-lg pt-6">
          {error && (
            <Alert
              variant="destructive"
              appearance="light"
              className="mb-4"
              onClose={() => setError(null)}
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nasrin Sultana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <BangladeshPhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="providerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVIDER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Mathematics tutoring, grades 6-8"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="identityDocumentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identity document type (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="identityDocumentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identity document number (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Register Provider'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
