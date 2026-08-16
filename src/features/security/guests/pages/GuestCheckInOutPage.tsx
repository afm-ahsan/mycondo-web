import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, LogIn, LogOut, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
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
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { GateSelect } from '@/components/shared/GateSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { EntryGateEmptyNotice } from '@/features/security/gates/components/EntryGateEmptyNotice';
import {
  useCheckInGuest,
  useCheckOutGuest,
  useGuestByPhone,
  useGuestVisits,
} from '../api/guestsApi';
import {
  checkInGuestSchema,
  checkOutGuestSchema,
  type CheckInGuestSchemaType,
  type CheckOutGuestSchemaType,
} from '../schemas/checkInGuestSchema';

const blockedToneMap: StatusBadgeMap<'Active' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

export function GuestCheckInOutPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null);

  const {
    data: guest,
    isFetching: isSearching,
    error: searchError,
  } = useGuestByPhone(searchedPhone ? { phone: searchedPhone } : skipToken);

  const { data: visits, refetch: refetchVisits } = useGuestVisits(
    guest ? { id: guest.guestProfileId, page: 1, pageSize: 5 } : skipToken,
  );
  const openVisit = visits?.items.find((visit) => !visit.exitAtUtc);

  function handleSearch() {
    setSearchedPhone(phoneInput.trim() || null);
  }

  return (
    <>
      <PageHeader
        title="Guest Check-in / Check-out"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Visitor Management' },
          { label: 'Check In / Out' },
        ]}
      />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Guest Check-in / Check-out</CardTitle>
          </CardHeader>
          <CardContent className="max-w-xl">
            <div className="flex gap-2">
              <Input
                placeholder="Search by mobile number"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!phoneInput.trim()}>
                <Search /> Search
              </Button>
            </div>

            {isSearching && (
              <p className="text-sm text-muted-foreground mt-3">Searching…</p>
            )}

            {searchedPhone && !isSearching && !guest && (
              <Alert variant="warning" appearance="light" className="mt-3">
                <AlertIcon>
                  <AlertTriangle />
                </AlertIcon>
                <AlertTitle>
                  {toApiError(searchError)
                    ? toUserMessage(toApiError(searchError))
                    : 'No guest found with that mobile number.'}
                </AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>

        {guest && (
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                {guest.fullName}
                <StatusBadge
                  status={guest.isBlocked ? 'Blocked' : 'Active'}
                  toneMap={blockedToneMap}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="max-w-xl">
              {guest.isBlocked && (
                <Alert
                  variant="destructive"
                  appearance="light"
                  className="mb-4"
                >
                  <AlertIcon>
                    <AlertTriangle />
                  </AlertIcon>
                  <AlertTitle>
                    This guest is blocked
                    {guest.blockReason ? `: ${guest.blockReason}` : '.'}{' '}
                    Check-in may be rejected by the server.
                  </AlertTitle>
                </Alert>
              )}

              {openVisit ? (
                <CheckOutForm
                  key={openVisit.accessSessionId}
                  guestName={guest.fullName}
                  accessSessionId={openVisit.accessSessionId}
                  onCheckedOut={refetchVisits}
                />
              ) : (
                // Keyed by guest so searching for a different guest resets the building/flat/gate
                // selections instead of carrying over a previous guest's in-progress form state.
                <CheckInForm
                  key={guest.guestProfileId}
                  guestProfileId={guest.guestProfileId}
                  onCheckedIn={refetchVisits}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function CheckInForm({
  guestProfileId,
  onCheckedIn,
}: {
  guestProfileId: string;
  onCheckedIn: () => void;
}) {
  const [checkIn, { isLoading }] = useCheckInGuest();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckInGuestSchemaType>({
    resolver: zodResolver(checkInGuestSchema),
    defaultValues: {
      guestProfileId,
      buildingId: '',
      hostFlatId: '',
      entryGateId: '',
      purposeOfVisit: '',
      passOrQrNumber: '',
      remarks: '',
      overrideReason: '',
    },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CheckInGuestSchemaType) {
    setError(null);
    try {
      await checkIn({
        checkInGuestCommand: {
          guestProfileId,
          hostFlatId: values.hostFlatId,
          purposeOfVisit: values.purposeOfVisit || null,
          entryGateId: values.entryGateId,
          passOrQrNumber: values.passOrQrNumber || null,
          remarks: values.remarks || null,
          overrideReason: values.overrideReason || null,
        },
      }).unwrap();
      toast.success('Guest checked in.');
      form.reset({
        ...form.getValues(),
        purposeOfVisit: '',
        passOrQrNumber: '',
        remarks: '',
        overrideReason: '',
      });
      // getApiV1GuestsByIdVisits (providesTags: ["Guests"]) isn't invalidated by this mutation
      // (invalidatesTags: ["AccessSessions"]) — a tag mismatch in the generated client, not
      // something to hand-edit in generated code. Force a refetch so the page immediately shows
      // the check-out form instead of stale "no open visit" data.
      onCheckedIn();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setError(null)}
          >
            <AlertIcon>
              <AlertTriangle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="buildingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <FormControl>
                <BuildingSelect
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hostFlatId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Host flat</FormLabel>
              <FormControl>
                <FlatSelect
                  buildingId={buildingId}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <EntryGateEmptyNotice buildingId={buildingId} capability="entry" />
        <FormField
          control={form.control}
          name="entryGateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entry gate</FormLabel>
              <FormControl>
                <GateSelect
                  buildingId={buildingId}
                  value={field.value}
                  onValueChange={field.onChange}
                  capability="entry"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purposeOfVisit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose of visit (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Visiting family" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passOrQrNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pass / QR number (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="overrideReason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Override reason (only if the server requires one)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Fill in only if check-in is rejected requesting an override"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          <LogIn /> {isLoading ? 'Checking in...' : 'Check In'}
        </Button>
      </form>
    </Form>
  );
}

function CheckOutForm({
  guestName,
  accessSessionId,
  onCheckedOut,
}: {
  guestName: string;
  accessSessionId: string;
  onCheckedOut: () => void;
}) {
  const [checkOut, { isLoading }] = useCheckOutGuest();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckOutGuestSchemaType>({
    resolver: zodResolver(checkOutGuestSchema),
    defaultValues: { buildingId: '', exitGateId: '' },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CheckOutGuestSchemaType) {
    setError(null);
    try {
      await checkOut({
        id: accessSessionId,
        checkOutGuestRequest: { exitGateId: values.exitGateId },
      }).unwrap();
      toast.success(`${guestName} checked out.`);
      onCheckedOut(); // see the matching comment in CheckInForm's onSubmit for why this is needed
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setError(null)}
          >
            <AlertIcon>
              <AlertTriangle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="buildingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exit building</FormLabel>
              <FormControl>
                <BuildingSelect
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <EntryGateEmptyNotice buildingId={buildingId} capability="exit" />
        <FormField
          control={form.control}
          name="exitGateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exit gate</FormLabel>
              <FormControl>
                <GateSelect
                  buildingId={buildingId}
                  value={field.value}
                  onValueChange={field.onChange}
                  capability="exit"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          <LogOut /> {isLoading ? 'Checking out...' : 'Check Out'}
        </Button>
      </form>
    </Form>
  );
}
