import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Landmark, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  useBlackoutDates,
  useCreateBlackoutDate,
  useCreateFacility,
  useDeactivateFacility,
  useFacilities,
  useReactivateFacility,
  useUpdateFacilityConfiguration,
} from '../../api/facilitiesApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { blackoutDateSchema, type BlackoutDateSchemaType } from '../../schemas/blackoutDateSchema';
import { facilitySchema, type FacilitySchemaType } from '../../schemas/facilitySchema';
import type { FacilityDto } from '@/api/generated/mycondoApi';

const SETTINGS_FILTER_DEFAULTS = { type: '__all__' };
const SETTINGS_COLUMN_COUNT = 5;

/**
 * Manages both Community Hall and Swimming Pool facilities — the menu tree only has a
 * "Closures/Settings" slot under Swimming Pool, but Facility is one backend entity for both types, so
 * this single page covers hall creation/configuration too (resolved with the user via
 * `AskUserQuestion` before this slice was built, see Slice G plan §"Two placement decisions").
 */
export function FacilitySettingsPage() {
  const [filters, setFilters] = useUrlFilters(SETTINGS_FILTER_DEFAULTS);
  const [editTarget, setEditTarget] = useState<FacilityDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [blackoutTarget, setBlackoutTarget] = useState<FacilityDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<FacilityDto | null>(null);

  const { data, isFetching, refetch } = useFacilities({
    facilityType: filters.type === '__all__' ? undefined : filters.type,
    page: 1,
    pageSize: 100,
  });
  const [deactivate, { isLoading: isDeactivating }] = useDeactivateFacility();
  const [reactivate] = useReactivateFacility();

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    try {
      await deactivate({ id: deactivateTarget.facilityId }).unwrap();
      toast.success(`${deactivateTarget.name} deactivated.`);
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleReactivate(facility: FacilityDto) {
    try {
      await reactivate({ id: facility.facilityId }).unwrap();
      toast.success(`${facility.name} reactivated.`);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Closures / Settings"
        crumbs={[{ label: 'Facilities' }, { label: 'Swimming Pool' }, { label: 'Closures / Settings' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.facility.manage}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Create Facility
            </Button>
          </RequirePermission>
        }
      />

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Facilities</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Select value={filters.type} onValueChange={(type) => setFilters({ type })}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                <SelectItem value="CommunityHall">Community Hall</SelectItem>
                <SelectItem value="SwimmingPool">Swimming Pool</SelectItem>
              </SelectContent>
            </Select>
          </CardToolbar>
        </CardHeader>
        <CardTable>
          {!isFetching && (!data || data.items.length === 0) ? (
            <EmptyState
              icon={<Landmark className="size-8" aria-hidden="true" />}
              title="No facilities configured yet"
              description="Create a Community Hall or Swimming Pool facility to get started."
            />
          ) : (
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableSkeleton columns={SETTINGS_COLUMN_COUNT} />
                  ) : (
                    (data?.items ?? []).map((facility) => (
                      <TableRow key={facility.facilityId}>
                        <TableCell className="font-medium">{facility.name}</TableCell>
                        <TableCell>{facility.facilityType}</TableCell>
                        <TableCell>{facility.capacity}</TableCell>
                        <TableCell>
                          <Badge variant={facility.isActive ? 'success' : 'secondary'} appearance="light">
                            {facility.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <RequirePermission permission={PERMISSIONS.facility.manage}>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditTarget(facility)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setBlackoutTarget(facility)}>
                                Closures
                              </Button>
                              {facility.isActive ? (
                                <Button size="sm" variant="outline" onClick={() => setDeactivateTarget(facility)}>
                                  Deactivate
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleReactivate(facility)}>
                                  Reactivate
                                </Button>
                              )}
                            </div>
                          </RequirePermission>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardTable>
      </Card>

      <FacilityFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
      <FacilityFormDialog
        open={editTarget !== null}
        facility={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          refetch();
        }}
      />
      <BlackoutDatesDialog
        facility={blackoutTarget}
        open={blackoutTarget !== null}
        onOpenChange={(open) => !open && setBlackoutTarget(null)}
      />
      <ConfirmActionDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate this facility?"
        description={
          deactivateTarget && (
            <>
              Deactivating <strong>{deactivateTarget.name}</strong> blocks all future bookings/access until it is reactivated. Existing
              bookings/sessions are not affected.
            </>
          )
        }
        confirmLabel="Deactivate"
        loadingLabel="Deactivating..."
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}

function FacilityFormDialog({
  open,
  facility,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  facility?: FacilityDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [createFacility, { isLoading: isCreating }] = useCreateFacility();
  const [updateFacility, { isLoading: isUpdating }] = useUpdateFacilityConfiguration();
  const isEdit = !!facility;
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.input<typeof facilitySchema>, unknown, FacilitySchemaType>({
    resolver: zodResolver(facilitySchema),
    values: facility
      ? {
          buildingId: facility.buildingId,
          name: facility.name,
          facilityType: facility.facilityType as 'CommunityHall' | 'SwimmingPool',
          capacity: Number(facility.capacity),
          operatingHoursStart: facility.operatingHoursStart ?? undefined,
          operatingHoursEnd: facility.operatingHoursEnd ?? undefined,
          requiresApproval: facility.requiresApproval,
          bookingChargeAmount: facility.bookingChargeAmount ? Number(facility.bookingChargeAmount) : undefined,
          depositAmount: facility.depositAmount ? Number(facility.depositAmount) : undefined,
          cancellationDeadlineHours: Number(facility.cancellationDeadlineHours),
          cancellationDeductionPercentage: Number(facility.cancellationDeductionPercentage),
          guestFeeAmount: facility.guestFeeAmount ? Number(facility.guestFeeAmount) : undefined,
          minimumAgeUnaccompanied:
            facility.minimumAgeUnaccompanied != null ? Number(facility.minimumAgeUnaccompanied) : undefined,
          requiresSafetyAcknowledgement: facility.requiresSafetyAcknowledgement,
          blocksEntryIfAccountOverdue: facility.blocksEntryIfAccountOverdue,
        }
      : undefined,
    defaultValues: {
      buildingId: '',
      name: '',
      facilityType: 'CommunityHall',
      capacity: 1,
      requiresApproval: false,
      cancellationDeadlineHours: 24,
      cancellationDeductionPercentage: 0,
      requiresSafetyAcknowledgement: false,
      blocksEntryIfAccountOverdue: false,
    },
  });

  const facilityType = form.watch('facilityType');

  async function onSubmit(values: FacilitySchemaType) {
    setError(null);
    try {
      if (isEdit && facility) {
        await updateFacility({
          id: facility.facilityId,
          updateFacilityConfigurationRequest: {
            name: values.name,
            capacity: values.capacity,
            operatingHoursStart: values.operatingHoursStart || null,
            operatingHoursEnd: values.operatingHoursEnd || null,
            requiresApproval: values.requiresApproval,
            bookingChargeAmount: values.bookingChargeAmount ?? null,
            depositAmount: values.depositAmount ?? null,
            cancellationDeadlineHours: values.cancellationDeadlineHours,
            cancellationDeductionPercentage: values.cancellationDeductionPercentage,
            guestFeeAmount: values.guestFeeAmount ?? null,
            minimumAgeUnaccompanied: values.minimumAgeUnaccompanied ?? null,
            requiresSafetyAcknowledgement: values.requiresSafetyAcknowledgement,
            blocksEntryIfAccountOverdue: values.blocksEntryIfAccountOverdue,
          },
        }).unwrap();
        toast.success('Facility updated.');
      } else {
        await createFacility({
          createFacilityCommand: {
            buildingId: values.buildingId,
            name: values.name,
            facilityType: values.facilityType,
            capacity: values.capacity,
            operatingHoursStart: values.operatingHoursStart || null,
            operatingHoursEnd: values.operatingHoursEnd || null,
            requiresApproval: values.requiresApproval,
            bookingChargeAmount: values.bookingChargeAmount ?? null,
            depositAmount: values.depositAmount ?? null,
            cancellationDeadlineHours: values.cancellationDeadlineHours,
            cancellationDeductionPercentage: values.cancellationDeductionPercentage,
            guestFeeAmount: values.guestFeeAmount ?? null,
            minimumAgeUnaccompanied: values.minimumAgeUnaccompanied ?? null,
            requiresSafetyAcknowledgement: values.requiresSafetyAcknowledgement,
            blocksEntryIfAccountOverdue: values.blocksEntryIfAccountOverdue,
          },
        }).unwrap();
        toast.success('Facility created.');
      }
      onSaved();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      // Field-level errors (e.g. a specific financial-field validation failure) stay inline via
      // FormMessage above; anything that can't be mapped to a field — a business-rule rejection on
      // the financial values as a whole — gets a persistent alert instead of a toast, since a toast
      // disappearing after a few seconds isn't enough time to read and correct a financial-config
      // mistake mid-form.
      if (!handled) setError(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${facility?.name}` : 'Create facility'}</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && (
              <>
                <FormField
                  control={form.control}
                  name="buildingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <FormControl>
                        <BuildingSelect value={field.value} onValueChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CommunityHall">Community Hall</SelectItem>
                          <SelectItem value="SwimmingPool">Swimming Pool</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatingHoursStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opens</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatingHoursEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closes</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {facilityType === 'CommunityHall' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="bookingChargeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking charge (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cancellationDeadlineHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancellation deadline (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cancellationDeductionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancellation deduction (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 col-span-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Requires approval before payment</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {facilityType === 'SwimmingPool' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="guestFeeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest fee (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimumAgeUnaccompanied"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum age unaccompanied</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresSafetyAcknowledgement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Requires safety acknowledgement</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blocksEntryIfAccountOverdue"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Block entry if account overdue</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isEdit ? (isUpdating ? 'Updating…' : 'Save') : isCreating ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BlackoutDatesDialog({
  facility,
  open,
  onOpenChange,
}: {
  facility: FacilityDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, refetch } = useBlackoutDates(facility ? { id: facility.facilityId } : skipToken);
  const [createBlackout, { isLoading }] = useCreateBlackoutDate();

  const form = useForm<BlackoutDateSchemaType>({
    resolver: zodResolver(blackoutDateSchema),
    defaultValues: { dateFrom: '', dateTo: '', reason: '' },
  });

  async function onSubmit(values: BlackoutDateSchemaType) {
    if (!facility) return;
    try {
      await createBlackout({
        id: facility.facilityId,
        createBlackoutDateRequest: values,
      }).unwrap();
      toast.success('Closure added.');
      form.reset();
      refetch();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Closures — {facility?.name}</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {(data ?? []).filter((b) => b.isActive).map((blackout) => (
            <li key={blackout.blackoutDateId} className="text-sm border rounded p-2">
              <div className="font-medium">
                {blackout.dateFrom} – {blackout.dateTo}
              </div>
              <div className="text-muted-foreground text-xs">{blackout.reason}</div>
            </li>
          ))}
          {(!data || data.filter((b) => b.isActive).length === 0) && (
            <li className="text-sm text-muted-foreground">No active closures.</li>
          )}
        </ul>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Annual maintenance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding…' : 'Add Closure'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
