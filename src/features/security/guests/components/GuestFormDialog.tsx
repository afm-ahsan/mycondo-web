import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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
import { EntityFormDialog } from '@/components/shared/EntityFormDialog';
import { useCreateGuestProfile } from '../api/guestsApi';
import {
  createGuestProfileSchema,
  type CreateGuestProfileSchemaType,
} from '../schemas/createGuestProfileSchema';

interface GuestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Create-only: the backend (Features/Security/Guests) exposes no update endpoint for a guest
// profile, only create/block/unblock.
export function GuestFormDialog({ open, onOpenChange }: GuestFormDialogProps) {
  const [createGuestProfile, { isLoading }] = useCreateGuestProfile();

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
      form.reset();
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
    <EntityFormDialog open={open} onOpenChange={onOpenChange} title="New Guest">
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
                  <BangladeshPhoneInput {...field} />
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
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Add Guest'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </EntityFormDialog>
  );
}
