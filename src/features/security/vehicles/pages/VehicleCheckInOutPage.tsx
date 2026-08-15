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
import {
  useCheckInVehicle,
  useCheckOutVehicle,
  useVehicleByRegistration,
  useVehicleTrips,
} from '../api/vehiclesApi';
import {
  checkInVehicleSchema,
  checkOutVehicleSchema,
  type CheckInVehicleSchemaType,
  type CheckOutVehicleSchemaType,
} from '../schemas/checkInVehicleSchema';

const blockedToneMap: StatusBadgeMap<'Active' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

export function VehicleCheckInOutPage() {
  const [registrationInput, setRegistrationInput] = useState('');
  const [searchedRegistration, setSearchedRegistration] = useState<
    string | null
  >(null);

  const {
    data: vehicle,
    isFetching: isSearching,
    error: searchError,
  } = useVehicleByRegistration(
    searchedRegistration
      ? { registrationNumber: searchedRegistration }
      : skipToken,
  );

  const { data: trips, refetch: refetchTrips } = useVehicleTrips(
    vehicle ? { id: vehicle.vehicleId, page: 1, pageSize: 5 } : skipToken,
  );
  const openTrip = trips?.items.find((trip) => !trip.exitAtUtc);

  function handleSearch() {
    setSearchedRegistration(registrationInput.trim() || null);
  }

  return (
    <>
      <PageHeader
        title="Vehicle Check-in / Check-out"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Vehicle Access', path: '/security/vehicles' },
          { label: 'Check In / Out' },
        ]}
      />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Find Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="max-w-xl">
            <div className="flex gap-2">
              <Input
                placeholder="Search by registration number"
                value={registrationInput}
                onChange={(e) => setRegistrationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={!registrationInput.trim()}
              >
                <Search /> Search
              </Button>
            </div>

            {isSearching && (
              <p className="text-sm text-muted-foreground mt-3">Searching…</p>
            )}

            {searchedRegistration && !isSearching && !vehicle && (
              <Alert variant="warning" appearance="light" className="mt-3">
                <AlertIcon>
                  <AlertTriangle />
                </AlertIcon>
                <AlertTitle>
                  {toApiError(searchError)
                    ? toUserMessage(toApiError(searchError))
                    : 'No vehicle found with that registration number.'}
                </AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>

        {vehicle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {vehicle.registrationNumber}
                <StatusBadge
                  status={vehicle.isBlocked ? 'Blocked' : 'Active'}
                  toneMap={blockedToneMap}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="max-w-xl">
              {vehicle.isBlocked && (
                <Alert
                  variant="destructive"
                  appearance="light"
                  className="mb-4"
                >
                  <AlertIcon>
                    <AlertTriangle />
                  </AlertIcon>
                  <AlertTitle>
                    This vehicle is blocked
                    {vehicle.blockReason ? `: ${vehicle.blockReason}` : '.'}{' '}
                    Check-in may be rejected by the server.
                  </AlertTitle>
                </Alert>
              )}

              {openTrip ? (
                <CheckOutForm
                  key={openTrip.accessSessionId}
                  registrationNumber={vehicle.registrationNumber}
                  accessSessionId={openTrip.accessSessionId}
                  onCheckedOut={refetchTrips}
                />
              ) : (
                // Keyed by vehicle so searching for a different vehicle resets the building/flat/gate
                // selections instead of carrying over a previous vehicle's in-progress form state.
                <CheckInForm
                  key={vehicle.vehicleId}
                  vehicleId={vehicle.vehicleId}
                  onCheckedIn={refetchTrips}
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
  vehicleId,
  onCheckedIn,
}: {
  vehicleId: string;
  onCheckedIn: () => void;
}) {
  const [checkIn, { isLoading }] = useCheckInVehicle();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckInVehicleSchemaType>({
    resolver: zodResolver(checkInVehicleSchema),
    defaultValues: {
      vehicleId,
      buildingId: '',
      hostFlatId: '',
      entryGateId: '',
      remarks: '',
      overrideReason: '',
    },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CheckInVehicleSchemaType) {
    setError(null);
    try {
      await checkIn({
        checkInVehicleCommand: {
          vehicleId,
          hostFlatId: values.hostFlatId || null,
          entryGateId: values.entryGateId,
          remarks: values.remarks || null,
          overrideReason: values.overrideReason || null,
        },
      }).unwrap();
      toast.success('Vehicle checked in.');
      form.reset({ ...form.getValues(), remarks: '', overrideReason: '' });
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
              <FormLabel>Building (optional)</FormLabel>
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
              <FormLabel>Host flat (optional)</FormLabel>
              <FormControl>
                <FlatSelect
                  buildingId={buildingId}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!buildingId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks (optional)</FormLabel>
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
  registrationNumber,
  accessSessionId,
  onCheckedOut,
}: {
  registrationNumber: string;
  accessSessionId: string;
  onCheckedOut: () => void;
}) {
  const [checkOut, { isLoading }] = useCheckOutVehicle();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckOutVehicleSchemaType>({
    resolver: zodResolver(checkOutVehicleSchema),
    defaultValues: { buildingId: '', exitGateId: '' },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CheckOutVehicleSchemaType) {
    setError(null);
    try {
      await checkOut({
        id: accessSessionId,
        checkOutVehicleRequest: { exitGateId: values.exitGateId },
      }).unwrap();
      toast.success(`${registrationNumber} checked out.`);
      onCheckedOut();
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
