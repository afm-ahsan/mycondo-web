import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { ResidentSelect, type ResidentSelectValue } from '@/components/shared/ResidentSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useFacilities } from '../../api/facilitiesApi';
import { useCheckOutPoolSession, usePoolSessions, useCheckInPoolSession } from '../../api/poolApi';
import { CapacityIndicator } from '../../components/CapacityIndicator';
import { PageHeader } from '@/components/shared/PageHeader';
import { parseDenialReasons } from '../../lib/bookingStatus';
import { poolCheckInSchema, type PoolCheckInSchemaType } from '../../schemas/poolCheckInSchema';
import type { FacilityDto } from '@/api/generated/mycondoApi';

export function PoolAccessPage() {
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [resident, setResident] = useState<ResidentSelectValue | null>(null);

  const { data: poolsData } = useFacilities({ facilityType: 'SwimmingPool', page: 1, pageSize: 100 });
  const facility = poolsData?.items.find((f) => f.facilityId === facilityId) ?? null;

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Pool Access" crumbs={[{ label: 'Facilities' }, { label: 'Swimming Pool' }, { label: 'Pool Access' }]} />

      <Card>
        <CardHeader>
          <CardTitle>1. Choose pool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FacilitySelect
            facilityType="SwimmingPool"
            value={facilityId}
            onValueChange={(id) => {
              setFacilityId(id);
              setResident(null);
            }}
            placeholder="Select a pool"
          />
          {facility && <CapacitySection facilityId={facility.facilityId} capacity={Number(facility.capacity)} />}
        </CardContent>
      </Card>

      {facility && (
        <Card>
          <CardHeader>
            <CardTitle>2. Find resident</CardTitle>
          </CardHeader>
          <CardContent>
            <ResidentSelect value={resident} onChange={setResident} />
          </CardContent>
        </Card>
      )}

      {facility && resident && (
        <PoolAccessForm key={`${facility.facilityId}-${resident.residentId}`} facility={facility} resident={resident} />
      )}
    </div>
  );
}

function CapacitySection({ facilityId, capacity }: { facilityId: string; capacity: number }) {
  const { data } = usePoolSessions({ facilityId, openOnly: true, page: 1, pageSize: 100 });
  const current = data ? Number(data.total) : 0;
  return <CapacityIndicator current={current} capacity={capacity} />;
}

function PoolAccessForm({ facility, resident }: { facility: FacilityDto; resident: ResidentSelectValue }) {
  const [checkIn, { isLoading }] = useCheckInPoolSession();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutPoolSession();
  const [denialReasons, setDenialReasons] = useState<string[]>([]);
  const [genericError, setGenericError] = useState<string | null>(null);

  const { data: openSessions, refetch } = usePoolSessions({
    facilityId: facility.facilityId,
    flatId: resident.flatId,
    openOnly: true,
    page: 1,
    pageSize: 10,
  });
  const openSession = openSessions?.items[0];

  const { data: adultSessions } = usePoolSessions({
    facilityId: facility.facilityId,
    flatId: resident.flatId,
    openOnly: true,
    page: 1,
    pageSize: 20,
  });
  const openAdultSessions = (adultSessions?.items ?? []).filter((s) => s.ageCategory === 'Adult');

  const form = useForm<PoolCheckInSchemaType>({
    resolver: zodResolver(poolCheckInSchema),
    defaultValues: {
      facilityId: facility.facilityId,
      residentId: resident.residentId,
      flatId: resident.flatId,
      personType: 'Resident',
      ageCategory: 'Adult',
      accompaniedBySessionId: '',
      safetyAcknowledged: false,
      overrideReason: '',
    },
  });

  const ageCategory = form.watch('ageCategory');

  async function onSubmit(values: PoolCheckInSchemaType) {
    setDenialReasons([]);
    setGenericError(null);
    try {
      await checkIn({
        checkInPoolSessionCommand: {
          facilityId: values.facilityId,
          flatId: values.flatId,
          personType: values.personType,
          ageCategory: values.ageCategory,
          accompaniedBySessionId: values.accompaniedBySessionId || null,
          safetyAcknowledged: values.safetyAcknowledged,
          overrideReason: values.overrideReason || null,
        },
      }).unwrap();
      toast.success('Checked in.');
      form.reset({ ...form.getValues(), overrideReason: '' });
      refetch();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (handled) return;
      const message = toUserMessage(apiError ?? err);
      if (apiError?.status === 403) {
        setDenialReasons(parseDenialReasons(message));
      } else {
        setGenericError(message);
      }
    }
  }

  async function handleCheckOut() {
    if (!openSession) return;
    try {
      await checkOut({ id: openSession.poolSessionId }).unwrap();
      toast.success('Checked out.');
      refetch();
    } catch (err) {
      setGenericError(toUserMessage(toApiError(err) ?? err));
    }
  }

  if (openSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{resident.fullName} is currently checked in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {genericError && (
            <Alert variant="destructive" appearance="light" onClose={() => setGenericError(null)}>
              <AlertIcon>
                <AlertTriangle />
              </AlertIcon>
              <AlertTitle>{genericError}</AlertTitle>
            </Alert>
          )}
          <Button onClick={handleCheckOut} disabled={isCheckingOut}>
            <LogOut /> {isCheckingOut ? 'Checking out…' : 'Check Out'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Check in {resident.fullName}</CardTitle>
      </CardHeader>
      <CardContent>
        {denialReasons.length > 0 && (
          <Alert variant="destructive" appearance="light" className="mb-4">
            <AlertIcon>
              <AlertTriangle />
            </AlertIcon>
            <div>
              <AlertTitle>Cannot check in:</AlertTitle>
              <ul className="list-disc ps-5 text-sm mt-1">
                {denialReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
        {genericError && (
          <Alert variant="destructive" appearance="light" className="mb-4" onClose={() => setGenericError(null)}>
            <AlertIcon>
              <AlertTriangle />
            </AlertIcon>
            <AlertTitle>{genericError}</AlertTitle>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Resident">Resident</SelectItem>
                      <SelectItem value="Guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ageCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Adult">Adult</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {ageCategory === 'Child' && (
              <FormField
                control={form.control}
                name="accompaniedBySessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accompanying adult (currently checked in)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an adult already checked in" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {openAdultSessions.map((session) => (
                          <SelectItem key={session.poolSessionId} value={session.poolSessionId}>
                            Session {session.poolSessionId.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="safetyAcknowledged"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Safety rules acknowledged</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            {denialReasons.length > 0 && (
              <FormField
                control={form.control}
                name="overrideReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Override reason (requires pool.override)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" disabled={isLoading}>
              <LogIn /> {isLoading ? 'Checking in…' : 'Check In'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
