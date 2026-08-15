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
import { PageHeader } from '@/components/shared/PageHeader';
import { useRegisterStaffMember } from '../api/staffAttendanceApi';
import { STAFF_ROLES } from '../lib/constants';
import {
  registerStaffMemberSchema,
  type RegisterStaffMemberSchemaType,
} from '../schemas/registerStaffMemberSchema';

// Create-only: mycondo-api's StaffAttendance feature exposes no update endpoint for a staff member's
// role/phone/active status (only registration, clock-in/out, and correction workflow) — do not invent one.
export function StaffMemberFormPage() {
  const navigate = useNavigate();
  const [registerStaffMember, { isLoading }] = useRegisterStaffMember();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterStaffMemberSchemaType>({
    resolver: zodResolver(registerStaffMemberSchema),
    defaultValues: { fullName: '', role: undefined, phone: '' },
  });

  async function onSubmit(values: RegisterStaffMemberSchemaType) {
    setError(null);

    try {
      const staffMember = await registerStaffMember({
        registerStaffMemberCommand: {
          fullName: values.fullName,
          role: values.role,
          phone: values.phone || null,
        },
      }).unwrap();

      toast.success(`"${staffMember.fullName}" added to the staff roster.`);
      navigate('/security/staff-attendance');
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
        title="Register Staff Member"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Staff Attendance', path: '/security/staff-attendance' },
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
                      <Input placeholder="e.g. 01711000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Register Staff Member'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
