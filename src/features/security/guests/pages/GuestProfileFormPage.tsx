import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
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
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useCreateGuestProfile } from '../api/guestsApi';
import {
  createGuestProfileSchema,
  type CreateGuestProfileSchemaType,
} from '../schemas/createGuestProfileSchema';

// Create-only: the backend (Features/Security/Guests) exposes no update endpoint for a guest
// profile, only create/block/unblock — so there is no "edit" mode here, unlike CreateTenantPage's
// sibling patterns elsewhere might suggest.
export function GuestProfileFormPage() {
  const navigate = useNavigate();
  const [createGuestProfile, { isLoading }] = useCreateGuestProfile();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateGuestProfileSchemaType>({
    resolver: zodResolver(createGuestProfileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      identityDocumentType: '',
      identityDocumentNumber: '',
    },
  });

  async function onSubmit(values: CreateGuestProfileSchemaType) {
    setError(null);

    try {
      const guest = await createGuestProfile({
        createGuestProfileCommand: {
          fullName: values.fullName,
          phone: values.phone,
          identityDocumentType: values.identityDocumentType || null,
          identityDocumentNumber: values.identityDocumentNumber || null,
        },
      }).unwrap();

      toast.success(`Guest "${guest.fullName}" added.`);
      navigate('/security/guests');
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>New Guest</CardTitle>
      </CardHeader>
      <CardContent>
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
                    <Input placeholder="e.g. Karim Ahmed" {...field} />
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
                    <Input placeholder="e.g. 01711000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <Input placeholder="e.g. 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Add Guest'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
