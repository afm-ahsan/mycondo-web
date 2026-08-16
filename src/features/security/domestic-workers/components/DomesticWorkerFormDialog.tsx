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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { EntityFormDialog } from '@/components/shared/EntityFormDialog';
import { useRegisterDomesticWorker } from '../api/domesticWorkersApi';
import { WORKER_TYPES } from '../lib/constants';
import {
  registerDomesticWorkerSchema,
  type RegisterDomesticWorkerSchemaType,
} from '../schemas/registerDomesticWorkerSchema';

interface DomesticWorkerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Create-only: mycondo-api's DomesticWorker feature exposes no update endpoint for the profile itself
// (only status transitions and assignments, handled by WorkerManageDialog).
export function DomesticWorkerFormDialog({ open, onOpenChange }: DomesticWorkerFormDialogProps) {
  const [registerWorker, { isLoading }] = useRegisterDomesticWorker();

  const form = useForm<RegisterDomesticWorkerSchemaType>({
    resolver: zodResolver(registerDomesticWorkerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      workerType: undefined,
      identityDocumentType: '',
      identityDocumentNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
  });

  async function onSubmit(values: RegisterDomesticWorkerSchemaType) {
    try {
      const worker = await registerWorker({
        registerDomesticWorkerCommand: {
          fullName: values.fullName,
          phone: values.phone,
          workerType: values.workerType,
          identityDocumentType: values.identityDocumentType || null,
          identityDocumentNumber: values.identityDocumentNumber || null,
          emergencyContactName: values.emergencyContactName || null,
          emergencyContactPhone: values.emergencyContactPhone || null,
        },
      }).unwrap();

      toast.success(`"${worker.fullName}" added to the domestic staff directory.`);
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
    <EntityFormDialog open={open} onOpenChange={onOpenChange} title="Register Worker">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Rahima Begum" {...field} />
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
            name="workerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Worker type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORKER_TYPES.map((type) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact name (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact phone (optional)</FormLabel>
                  <FormControl>
                    <BangladeshPhoneInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Register Worker'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </EntityFormDialog>
  );
}
