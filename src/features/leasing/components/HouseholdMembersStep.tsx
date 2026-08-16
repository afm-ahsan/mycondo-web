import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { BloodGroupSelect } from '@/components/shared/BloodGroupSelect';
import { DateOfBirthWithAge } from '@/components/shared/DateOfBirthWithAge';
import { GenderSelect } from '@/components/shared/GenderSelect';
import { HouseholdMemberCard } from '@/components/shared/HouseholdMemberCard';
import { HouseholdMemberPhotoUpload } from '@/components/shared/HouseholdMemberPhotoUpload';
import { Input } from '@/components/ui/input';
import { RelationshipSelect } from '@/components/shared/RelationshipSelect';
import { AttachmentUploadPanel } from '@/features/attachments/components/AttachmentUploadPanel';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useAddHouseholdMember,
  useDeactivateHouseholdMember,
  useHouseholdMembers,
  useSetHouseholdMemberPrimaryPhoto,
  useUpdateHouseholdMember,
} from '../api/leasingApi';
import { householdMemberSchema, type HouseholdMemberSchemaType } from '../schemas/householdMemberSchema';

interface HouseholdMembersStepProps {
  registrationId: string;
  onContinue: () => void;
  onBack: () => void;
}

const EMPTY_VALUES: HouseholdMemberSchemaType = {
  fullName: '',
  relationshipToPrimary: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  nationalIdNumber: '',
  birthCertificateNumber: '',
  bloodGroup: '',
  religion: '',
  nationality: '',
  occupation: '',
};

/** Step 3 — the household member list. Optional (a single-occupant registration can skip straight
 * to Continue); each member is its own backend record, added/updated/deactivated immediately rather
 * than batched with the rest of the wizard, so the list here is always the source of truth. */
export function HouseholdMembersStep({ registrationId, onContinue, onBack }: HouseholdMembersStepProps) {
  const { data: members, isLoading: isLoadingMembers } = useHouseholdMembers({ id: registrationId });
  const [addMember, { isLoading: isAdding }] = useAddHouseholdMember();
  const [updateMember, { isLoading: isUpdating }] = useUpdateHouseholdMember();
  const [deactivateMember] = useDeactivateHouseholdMember();
  const [setPrimaryPhoto] = useSetHouseholdMemberPrimaryPhoto();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<HouseholdMemberSchemaType>({
    resolver: zodResolver(householdMemberSchema),
    defaultValues: EMPTY_VALUES,
  });

  const isChild = form.watch('relationshipToPrimary') === 'Child';
  const isSaving = isAdding || isUpdating;

  function startEdit(member: NonNullable<typeof members>[number]) {
    setEditingId(member.householdMemberId);
    form.reset({
      fullName: member.fullName,
      relationshipToPrimary: member.relationshipToPrimary,
      dateOfBirth: member.dateOfBirth ?? '',
      gender: member.gender ?? '',
      phone: member.phone ?? '',
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

  async function onSubmit(values: HouseholdMemberSchemaType) {
    setError(null);
    const request = {
      fullName: values.fullName,
      relationshipToPrimary: values.relationshipToPrimary,
      dateOfBirth: values.dateOfBirth || null,
      phone: values.phone || null,
      nationalIdNumber: values.nationalIdNumber || null,
      gender: values.gender || null,
      birthCertificateNumber: values.birthCertificateNumber || null,
      bloodGroup: values.bloodGroup || null,
      religion: values.religion || null,
      nationality: values.nationality || null,
      occupation: values.occupation || null,
    };

    try {
      if (editingId) {
        await updateMember({ id: editingId, updateHouseholdMemberRequest: request }).unwrap();
      } else {
        await addMember({ id: registrationId, addHouseholdMemberRequest: request }).unwrap();
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
  const editingMember = editingId ? activeMembers.find((m) => m.householdMemberId === editingId) : undefined;

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
            <HouseholdMemberCard
              key={member.householdMemberId}
              relationshipLabel={member.relationshipToPrimary}
              fullName={member.fullName}
              gender={member.gender}
              dateOfBirth={member.dateOfBirth}
              photoAttachmentId={member.primaryPhotoAttachmentId}
              onEdit={() => startEdit(member)}
              onRemove={() => deactivateMember({ id: member.householdMemberId })}
              disabled={isSaving}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No household members added yet. Add family members below, or continue if the primary occupant
          lives alone.
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {editingMember && (
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start border-b pb-4">
                  <HouseholdMemberPhotoUpload
                    ownerType="LeasingHouseholdMember"
                    ownerId={editingMember.householdMemberId}
                    primaryPhotoAttachmentId={editingMember.primaryPhotoAttachmentId}
                    onSetPrimaryPhoto={(attachmentId) =>
                      setPrimaryPhoto({
                        id: editingMember.householdMemberId,
                        setPrimaryPhotoRequest: { attachmentId },
                      }).unwrap()
                    }
                  />
                  <div className="space-y-2">
                    <FormLabel>Documents (NID, Birth Certificate, etc.)</FormLabel>
                    <AttachmentUploadPanel
                      ownerType="LeasingHouseholdMember"
                      ownerId={editingMember.householdMemberId}
                      excludeAttachmentIds={
                        editingMember.primaryPhotoAttachmentId ? [editingMember.primaryPhotoAttachmentId] : []
                      }
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      maxSizeMb={10}
                    />
                  </div>
                </div>
              )}
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
                  name="relationshipToPrimary"
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                    Cancel
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                  <Plus className="size-4" />
                  {editingId ? (isSaving ? 'Saving…' : 'Update household member') : isSaving ? 'Adding…' : 'Add household member'}
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
