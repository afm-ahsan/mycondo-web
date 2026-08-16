import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import type { DomesticWorkerProfileDto } from '@/api/generated/mycondoApi';
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
import { EntryGateEmptyNotice } from '@/features/security/gates/components/EntryGateEmptyNotice';
import {
  useCheckInWorker,
  useCheckOutWorker,
  useCurrentlyInsideAccessSessions,
  useDomesticWorkers,
} from '../api/domesticWorkersApi';
import {
  checkInDomesticWorkerSchema,
  checkOutDomesticWorkerSchema,
  type CheckInDomesticWorkerSchemaType,
  type CheckOutDomesticWorkerSchemaType,
} from '../schemas/checkInDomesticWorkerSchema';

const statusToneMap: StatusBadgeMap<'Active' | 'Suspended' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Suspended: { label: 'Suspended', variant: 'warning' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

/**
 * Unlike Guest/Vehicle check-in/out, there is no by-phone or GetById lookup for a single domestic
 * worker, and AccessSessionDto carries no domesticWorkerProfileId field — so there's no way to ask
 * "does worker X currently have an open session?" directly. This page works within that constraint
 * rather than faking a lookup that doesn't exist: the top half is search-and-select-then-check-in
 * (search results always shown as an explicit pick list, never an auto-selected "best match" — this
 * is a security gate, picking the wrong person by accident is the failure mode to avoid); the bottom
 * half is the tenant-wide currently-inside list (the one query that *does* exist) with a check-out
 * button per row, since that's the only way to identify an open session to close.
 */
export function DomesticWorkerCheckInOutPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] =
    useState<DomesticWorkerProfileDto | null>(null);

  const { data: results, isFetching: isSearching } = useDomesticWorkers(
    searchTerm ? { search: searchTerm, page: 1, pageSize: 5 } : skipToken,
  );

  function handleSearch() {
    setSelectedWorker(null);
    setSearchTerm(query.trim() || null);
  }

  return (
    <>
      <PageHeader
        title="Domestic Staff Check-in / Check-out"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Domestic Staff', path: '/security/domestic-workers' },
          { label: 'Check In / Out' },
        ]}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Find Worker</CardTitle>
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
                    No domestic worker found matching &quot;{searchTerm}&quot;.
                  </AlertTitle>
                </Alert>
              )}

            {searchTerm &&
              !isSearching &&
              results &&
              results.items.length > 0 &&
              !selectedWorker && (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {results.items.map((worker) => (
                    <li key={worker.domesticWorkerProfileId}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm hover:bg-accent"
                        onClick={() => setSelectedWorker(worker)}
                      >
                        <span>
                          <span className="font-medium">{worker.fullName}</span>{' '}
                          <span className="text-muted-foreground">
                            ({worker.workerType}, {worker.phone})
                          </span>
                        </span>
                        <StatusBadge
                          status={
                            worker.status as 'Active' | 'Suspended' | 'Blocked'
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

        {selectedWorker && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedWorker.fullName}
                <StatusBadge
                  status={
                    selectedWorker.status as 'Active' | 'Suspended' | 'Blocked'
                  }
                  toneMap={statusToneMap}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="max-w-2xl">
              {selectedWorker.status !== 'Active' && (
                <Alert
                  variant="destructive"
                  appearance="light"
                  className="mb-4"
                >
                  <AlertIcon>
                    <AlertTriangle />
                  </AlertIcon>
                  <AlertTitle>
                    This worker is {selectedWorker.status.toLowerCase()}
                    {selectedWorker.statusReason
                      ? `: ${selectedWorker.statusReason}`
                      : '.'}{' '}
                    Check-in may be rejected by the server.
                  </AlertTitle>
                </Alert>
              )}
              <CheckInForm
                key={selectedWorker.domesticWorkerProfileId}
                domesticWorkerProfileId={selectedWorker.domesticWorkerProfileId}
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
  domesticWorkerProfileId,
}: {
  domesticWorkerProfileId: string;
}) {
  const [checkIn, { isLoading }] = useCheckInWorker();
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const form = useForm<CheckInDomesticWorkerSchemaType>({
    resolver: zodResolver(checkInDomesticWorkerSchema),
    defaultValues: {
      domesticWorkerProfileId,
      buildingId: '',
      hostFlatId: '',
      entryGateId: '',
      remarks: '',
      overrideReason: '',
    },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CheckInDomesticWorkerSchemaType) {
    setError(null);
    try {
      await checkIn({
        checkInDomesticWorkerCommand: {
          domesticWorkerProfileId,
          hostFlatId: values.hostFlatId,
          entryGateId: values.entryGateId,
          remarks: values.remarks || null,
          overrideReason: values.overrideReason || null,
        },
      }).unwrap();
      toast.success('Worker checked in.');
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
          Checked in. Use the currently-inside list below to check this worker
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
    category: 'DomesticWorker',
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
            title="No domestic staff currently inside"
            description="No domestic staff are currently checked in."
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
  const [checkOut, { isLoading }] = useCheckOutWorker();
  const [open, setOpen] = useState(false);

  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <span>
        Flat {hostFlatId ?? '—'} · entered{' '}
        {new Date(entryAtUtc).toLocaleString()}
      </span>
      {open ? (
        <CheckOutInlineForm
          accessSessionId={accessSessionId}
          isSubmitting={isLoading}
          onCheckOut={async (exitGateId) => {
            try {
              await checkOut({
                id: accessSessionId,
                checkOutDomesticWorkerRequest: { exitGateId },
              }).unwrap();
              toast.success('Worker checked out.');
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
  accessSessionId: string;
  isSubmitting: boolean;
  onCheckOut: (exitGateId: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<CheckOutDomesticWorkerSchemaType>({
    resolver: zodResolver(checkOutDomesticWorkerSchema),
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
          capability="exit"
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
