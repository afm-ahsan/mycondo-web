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
import { useRegisterStaffMember } from '../api/staffAttendanceApi';
import { STAFF_ROLES } from '../lib/constants';
import {
  registerStaffMemberSchema,
  type RegisterStaffMemberSchemaType,
} from '../schemas/registerStaffMemberSchema';

interface StaffMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Create-only: mycondo-api's StaffAttendance feature exposes no update endpoint for a staff member's
// role/phone/active status (only registration, clock-in/out, and correction workflow).
export function StaffMemberFormDialog({ open, onOpenChange }: StaffMemberFormDialogProps) {
  const [registerStaffMember, { isLoading }] = useRegisterStaffMember();

  const form = useForm<RegisterStaffMemberSchemaType>({
    resolver: zodResolver(registerStaffMemberSchema),
    defaultValues: { fullName: '', role: undefined, phone: '' },
  });

  async function onSubmit(values: RegisterStaffMemberSchemaType) {
    try {
      const staffMember = await registerStaffMember({
        registerStaffMemberCommand: {
          fullName: values.fullName,
          role: values.role,
          phone: values.phone || null,
        },
      }).unwrap();

      toast.success(`"${staffMember.fullName}" added to the staff roster.`);
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
    <EntityFormDialog open={open} onOpenChange={onOpenChange} title="Register Staff Member" size="sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Md. Karim Sheikh" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile number (optional)</FormLabel>
                <FormControl>
                  <BangladeshPhoneInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Register Staff Member'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </EntityFormDialog>
  );
}
