import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BloodGroupSelect } from '@/components/shared/BloodGroupSelect';
import { DateOfBirthWithAge } from '@/components/shared/DateOfBirthWithAge';
import { GenderSelect } from '@/components/shared/GenderSelect';
import { HouseholdMemberCard } from '@/components/shared/HouseholdMemberCard';
import { RelationshipSelect } from '@/components/shared/RelationshipSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useAddOwnerHouseholdMember,
  useDeactivateOwnerHouseholdMember,
  useOwnerHouseholdMembers,
  useUpdateOwnerHouseholdMember,
} from '../api/residentsApi';
import { ownerHouseholdMemberSchema, type OwnerHouseholdMemberSchemaType } from '../schemas/ownerHouseholdMemberSchema';

interface OwnerHouseholdStepProps {
  residentId: string;
  onContinue: () => void;
  onBack: () => void;
}

const EMPTY_VALUES: OwnerHouseholdMemberSchemaType = {
  fullName: '',
  relationshipType: '',
  gender: '',
  dateOfBirth: '',
  nationalIdNumber: '',
  birthCertificateNumber: '',
  bloodGroup: '',
  religion: '',
  nationality: '',
  occupation: '',
};

/** Step 3 — Father/Mother/Spouse/Child family members, recorded against the Resident created in
 * Step 2. Optional: a single-owner registration can skip straight to Continue. Each member is its own
 * backend record, added/updated/deactivated immediately rather than batched with the rest of the
 * wizard, matching Tenant Registration's Household step. */
export function OwnerHouseholdStep({ residentId, onContinue, onBack }: OwnerHouseholdStepProps) {
  const { data: members, isLoading: isLoadingMembers } = useOwnerHouseholdMembers({ id: residentId });
  const [addMember, { isLoading: isAdding }] = useAddOwnerHouseholdMember();
  const [updateMember, { isLoading: isUpdating }] = useUpdateOwnerHouseholdMember();
  const [deactivateMember] = useDeactivateOwnerHouseholdMember();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OwnerHouseholdMemberSchemaType>({
    resolver: zodResolver(ownerHouseholdMemberSchema),
    defaultValues: EMPTY_VALUES,
  });

  const isChild = form.watch('relationshipType') === 'Child';
  const isSaving = isAdding || isUpdating;

  function startEdit(member: NonNullable<typeof members>[number]) {
    setEditingId(member.residentHouseholdMemberId);
    form.reset({
      fullName: member.fullName,
      relationshipType: member.relationshipType,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      // National ID / Birth Certificate are masked on read and can never be round-tripped back into
      // this form — leaving these blank on submit preserves the existing value server-side.
      nationalIdNumber: '',
      birthCertificateNumber: '',
      bloodGroup: member.bloodGroup ?? '',
      religion: member.religion ?? '',
      nationality: member.nationality ?? '',
      occupation: member.occupation ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    form.reset(EMPTY_VALUES);
  }

  async function onSubmit(values: OwnerHouseholdMemberSchemaType) {
    setError(null);
    const request = {
      fullName: values.fullName,
      relationshipType: values.relationshipType,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      nationalIdNumber: values.nationalIdNumber || null,
      birthCertificateNumber: values.birthCertificateNumber || null,
      bloodGroup: values.bloodGroup || null,
      religion: values.religion || null,
      nationality: values.nationality || null,
      occupation: values.occupation || null,
    };

    try {
      if (editingId) {
        await updateMember({ id: editingId, updateOwnerHouseholdMemberRequest: request }).unwrap();
      } else {
        await addMember({ id: residentId, addOwnerHouseholdMemberRequest: request }).unwrap();
      }
      setEditingId(null);
      form.reset(EMPTY_VALUES);
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

      {!isLoadingMembers && activeMembers.length > 0 && (
        <div className="space-y-2">
          {activeMembers.map((member) => (
            <HouseholdMemberCard
              key={member.residentHouseholdMemberId}
              relationshipLabel={member.relationshipType}
              fullName={member.fullName}
              gender={member.gender}
              dateOfBirth={member.dateOfBirth}
              onEdit={() => startEdit(member)}
              onRemove={() => deactivateMember({ id: member.residentHouseholdMemberId })}
              disabled={isSaving}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  name="relationshipType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <RelationshipSelect value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <GenderSelect value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of birth</FormLabel>
                      <FormControl>
                        <DateOfBirthWithAge {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationalIdNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID {isChild ? '(or Birth Certificate)' : '(optional)'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={editingId ? 'Leave blank to keep existing' : undefined} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthCertificateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth certificate {isChild ? '(or National ID)' : '(optional)'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={editingId ? 'Leave blank to keep existing' : undefined} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood group (optional)</FormLabel>
                      <BloodGroupSelect value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isChild ? 'Education / Occupation (optional)' : 'Profession (optional)'}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                    Cancel
                  </Button>
                )}
                <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                  <Plus className="size-4" />
                  {editingId ? (isSaving ? 'Saving…' : 'Update family member') : isSaving ? 'Adding…' : 'Add family member'}
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

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
