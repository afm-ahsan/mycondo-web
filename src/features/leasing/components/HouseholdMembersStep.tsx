import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toUserMessage } from '@/api/errors';
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
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { useAddHouseholdMember, useDeactivateHouseholdMember, useHouseholdMembers } from '../api/leasingApi';
import { householdMemberSchema, type HouseholdMemberSchemaType } from '../schemas/householdMemberSchema';

interface HouseholdMembersStepProps {
  registrationId: string;
  onContinue: () => void;
  onBack: () => void;
}

/** Step 3 — the household member list. Optional (a single-occupant registration can skip straight
 * to Continue); each member is its own backend record, added/deactivated immediately rather than
 * batched with the rest of the wizard, so the list here is always the source of truth. */
export function HouseholdMembersStep({ registrationId, onContinue, onBack }: HouseholdMembersStepProps) {
  const { data: members, isLoading: isLoadingMembers } = useHouseholdMembers({ id: registrationId });
  const [addMember, { isLoading: isAdding }] = useAddHouseholdMember();
  const [deactivateMember] = useDeactivateHouseholdMember();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<HouseholdMemberSchemaType>({
    resolver: zodResolver(householdMemberSchema),
    defaultValues: { fullName: '', relationshipToPrimary: '', dateOfBirth: '', phone: '', nationalIdNumber: '' },
  });

  useUnsavedChangesGuard(form.formState.isDirty);

  async function onSubmit(values: HouseholdMemberSchemaType) {
    setError(null);

    try {
      await addMember({
        id: registrationId,
        addHouseholdMemberRequest: {
          fullName: values.fullName,
          relationshipToPrimary: values.relationshipToPrimary,
          dateOfBirth: values.dateOfBirth || null,
          phone: values.phone || null,
          nationalIdNumber: values.nationalIdNumber || null,
        },
      }).unwrap();
      form.reset();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  const activeMembers = members?.filter((m) => m.isActive) ?? [];

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      {isLoadingMembers ? (
        <p className="text-muted-foreground text-sm">Loading household members…</p>
      ) : activeMembers.length > 0 ? (
        <div className="space-y-2">
          {activeMembers.map((member) => (
            <Card key={member.householdMemberId}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{member.fullName}</p>
                  <p className="text-muted-foreground text-xs">{member.relationshipToPrimary}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deactivateMember({ id: member.householdMemberId })}
                  aria-label={`Remove ${member.fullName}`}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No household members added yet. Add family members below, or continue if the primary occupant
          lives alone.
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="relationshipToPrimary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Spouse, Child, Parent" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth (optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Mobile number (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" disabled={isAdding}>
              {isAdding ? 'Adding…' : 'Add household member'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
