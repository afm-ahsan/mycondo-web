import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import type { ServiceProviderProfileDto } from '@/api/generated/mycondoApi';
import { zodResolver } from '@hookform/resolvers/zod';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, LogIn, LogOut, Search, Users } from 'lucide-react';
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
import { EmptyState } from '@/components/feedback/EmptyState';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { GateSelect } from '@/components/shared/GateSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  useCheckInProvider,
  useCheckOutProvider,
  useCurrentlyInsideAccessSessions,
  useServiceProviders,
} from '../api/serviceProvidersApi';
import {
  checkInServiceProviderSchema,
  checkOutServiceProviderSchema,
  type CheckInServiceProviderSchemaType,
  type CheckOutServiceProviderSchemaType,
} from '../schemas/checkInServiceProviderSchema';

const statusToneMap: StatusBadgeMap<'Active' | 'Suspended' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Suspended: { label: 'Suspended', variant: 'warning' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

// Same design constraint and rationale as DomesticWorkerCheckInOutPage — no by-phone/GetById lookup,
// no domesticWorkerProfileId-equivalent field on AccessSessionDto, so search results are an explicit
// pick list and check-out works from the tenant-wide currently-inside list.
export function ServiceProviderCheckInOutPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<ServiceProviderProfileDto | null>(null);

  const { data: results, isFetching: isSearching } = useServiceProviders(
    searchTerm ? { search: searchTerm, page: 1, pageSize: 5 } : skipToken,
  );

  function handleSearch() {
    setSelectedProvider(null);
    setSearchTerm(query.trim() || null);
  }

  return (
    <>
      <PageHeader
        title="Service Provider Check-in / Check-out"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Service Providers', path: '/security/service-providers' },
          { label: 'Check In / Out' },
        ]}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Find Provider</CardTitle>
          </CardHeader>
          <CardContent className="max-w-2xl space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or mobile number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!query.trim()}>
                <Search /> Search
              </Button>
            </div>

            {isSearching && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <InlineSpinner /> Searching…
              </p>
            )}

            {searchTerm &&
              !isSearching &&
              (!results || results.items.length === 0) && (
                <Alert variant="warning" appearance="light">
                  <AlertIcon>
                    <AlertTriangle />
                  </AlertIcon>
                  <AlertTitle>
                    No service provider found matching &quot;{searchTerm}&quot;.
                  </AlertTitle>
                </Alert>
              )}

            {searchTerm &&
              !isSearching &&
              results &&
              results.items.length > 0 &&
              !selectedProvider && (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {results.items.map((provider) => (
                    <li key={provider.serviceProviderProfileId}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm hover:bg-accent"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <span>
                          <span className="font-medium">
                            {provider.fullName}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            ({provider.providerType}, {provider.phone})
                          </span>
                        </span>
                        <StatusBadge
                          status={
                            provider.status as
                              | 'Active'
                              | 'Suspended'
                              | 'Blocked'
                          }
                          toneMap={statusToneMap}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>

        {selectedProvider && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedProvider.fullName}
                <StatusBadge
                  status={
                    selectedProvider.status as
                      | 'Active'
                      | 'Suspended'
                      | 'Blocked'
                  }
                  toneMap={statusToneMap}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="max-w-2xl">
              {selectedProvider.status !== 'Active' && (
                <Alert
                  variant="destructive"
                  appearance="light"
                  className="mb-4"
                >
                  <AlertIcon>
                    <AlertTriangle />
                  </AlertIcon>
                  <AlertTitle>
                    This provider is {selectedProvider.status.toLowerCase()}
                    {selectedProvider.statusReason
                      ? `: ${selectedProvider.statusReason}`
                      : '.'}{' '}
                    Check-in may be rejected by the server.
                  </AlertTitle>
                </Alert>
              )}
              <CheckInForm
                key={selectedProvider.serviceProviderProfileId}
                serviceProviderProfileId={
                  selectedProvider.serviceProviderProfileId
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <CurrentlyInsideQuickList />
      </div>
    </>
  );
}

function CheckInForm({
  serviceProviderProfileId,
}: {
  serviceProviderProfileId: string;
}) {
  const [checkIn, { isLoading }] = useCheckInProvider();
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const form = useForm<CheckInServiceProviderSchemaType>({
    resolver: zodResolver(checkInServiceProviderSchema),
    defaultValues: {
      serviceProviderProfileId,
      buildingId: '',
      hostFlatId: '',
      entryGateId: '',
      remarks: '',
      overrideReason: '',
    },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CheckInServiceProviderSchemaType) {
    setError(null);
    try {
      await checkIn({
        checkInServiceProviderCommand: {
          serviceProviderProfileId,
          hostFlatId: values.hostFlatId,
          entryGateId: values.entryGateId,
          remarks: values.remarks || null,
          overrideReason: values.overrideReason || null,
        },
      }).unwrap();
      toast.success('Provider checked in.');
      setSucceeded(true);
      form.reset({ ...form.getValues(), remarks: '', overrideReason: '' });
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  if (succeeded) {
    return (
      <Alert variant="success" appearance="light">
        <AlertTitle>
          Checked in. Use the currently-inside list below to check this provider
          out later.
        </AlertTitle>
      </Alert>
    );
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

function CurrentlyInsideQuickList() {
  const { data, isLoading } = useCurrentlyInsideAccessSessions({
    category: 'ServiceProvider',
    page: 1,
    pageSize: 20,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currently Inside</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2 max-w-2xl">
            <InlineSpinner /> Loading…
          </p>
        )}
        {!isLoading && (!data || data.items.length === 0) && (
          <EmptyState
            icon={<Users className="size-8" aria-hidden="true" />}
            title="No service providers currently inside"
            description="No service providers are currently checked in."
          />
        )}
        {!isLoading && data && data.items.length > 0 && (
          <ul className="divide-y divide-border max-w-2xl">
            {data.items.map((session) => (
              <CheckOutRow
                key={session.accessSessionId}
                accessSessionId={session.accessSessionId}
                hostFlatId={session.hostFlatId}
                entryAtUtc={session.entryAtUtc}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CheckOutRow({
  accessSessionId,
  hostFlatId,
  entryAtUtc,
}: {
  accessSessionId: string;
  hostFlatId: string | null;
  entryAtUtc: string;
}) {
  const [checkOut, { isLoading }] = useCheckOutProvider();
  const [open, setOpen] = useState(false);

  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <span>
        Flat {hostFlatId ?? '—'} · entered{' '}
        {new Date(entryAtUtc).toLocaleString()}
      </span>
      {open ? (
        <CheckOutInlineForm
          isSubmitting={isLoading}
          onCheckOut={async (exitGateId) => {
            try {
              await checkOut({
                id: accessSessionId,
                checkOutServiceProviderRequest: { exitGateId },
              }).unwrap();
              toast.success('Provider checked out.');
            } catch (err) {
              toast.error(toUserMessage(err));
            }
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <LogOut /> Check out
        </Button>
      )}
    </li>
  );
}

function CheckOutInlineForm({
  isSubmitting,
  onCheckOut,
  onCancel,
}: {
  isSubmitting: boolean;
  onCheckOut: (exitGateId: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<CheckOutServiceProviderSchemaType>({
    resolver: zodResolver(checkOutServiceProviderSchema),
    defaultValues: { buildingId: '', exitGateId: '' },
  });
  const buildingId = form.watch('buildingId');

  return (
    <div className="flex items-center gap-2">
      <div className="w-36">
        <BuildingSelect
          value={buildingId}
          onValueChange={(v) => form.setValue('buildingId', v)}
        />
      </div>
      <div className="w-36">
        <GateSelect
          buildingId={buildingId}
          value={form.watch('exitGateId')}
          onValueChange={(v) => form.setValue('exitGateId', v)}
        />
      </div>
      <Button
        size="sm"
        disabled={isSubmitting || !form.watch('exitGateId')}
        onClick={form.handleSubmit((values) => onCheckOut(values.exitGateId))}
      >
        {isSubmitting ? 'Checking out...' : 'Confirm'}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
