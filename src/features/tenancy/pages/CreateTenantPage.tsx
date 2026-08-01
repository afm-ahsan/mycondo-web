import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ApiError, toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ProvisionTenantResult } from '@/api/generated/mycondoApi';
import { useCreateTenant } from '../api/tenancyApi';
import { createTenantSchema, type CreateTenantSchemaType } from '../schemas/createTenantSchema';

// Deliberately minimal: no tenant list/get-by-id endpoint exists yet, and every tenant's SuperAdmin
// is bootstrapped with tenant.manage today (a scoping question flagged for a future slice, not
// resolved here) — so this screen offers only the one unambiguous, already-correctly-gated action:
// creating a brand-new tenant.
export function CreateTenantPage() {
  const [createTenant, { isLoading }] = useCreateTenant();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ProvisionTenantResult | null>(null);

  const form = useForm<CreateTenantSchemaType>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: '', slug: '' },
  });

  async function onSubmit(values: CreateTenantSchemaType) {
    setError(null);
    setCreated(null);

    try {
      const result = await createTenant({
        provisionTenantCommand: { name: values.name, slug: values.slug },
      }).unwrap();
      setCreated(result);
      form.reset();
    } catch (err) {
      const apiError = toApiError(err);

      if (apiError?.isConflict) {
        form.setError('slug', { message: 'A tenant with this slug already exists.' });
        return;
      }
      if (apiError?.isValidation && apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          const fieldName = field.toLowerCase() as keyof CreateTenantSchemaType;
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
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Create Tenant</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" appearance="light" className="mb-4" onClose={() => setError(null)}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {created && (
          <Alert variant="success" appearance="light" className="mb-4">
            <AlertIcon>
              <CheckCircle2 />
            </AlertIcon>
            <AlertTitle>
              Tenant &quot;{created.name}&quot; created (slug: {created.slug}). Its first registrant
              becomes SuperAdmin automatically.
            </AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ARP Flat Owners Association" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. arp-flat-owners" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function toApiError(err: unknown): ApiError | null {
  if (err && typeof err === 'object' && 'data' in err && err.data instanceof ApiError) {
    return err.data;
  }
  return null;
}
