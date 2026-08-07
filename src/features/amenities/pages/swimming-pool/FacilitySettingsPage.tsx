import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useBlackoutDates,
  useCreateBlackoutDate,
  useCreateFacility,
  useDeactivateFacility,
  useFacilities,
  useReactivateFacility,
  useUpdateFacilityConfiguration,
} from '../../api/facilitiesApi';
import { PageHeader } from '../../components/PageHeader';
import { blackoutDateSchema, type BlackoutDateSchemaType } from '../../schemas/blackoutDateSchema';
import { facilitySchema, type FacilitySchemaType } from '../../schemas/facilitySchema';
import type { FacilityDto } from '@/api/generated/mycondoApi';

/**
 * Manages both Community Hall and Swimming Pool facilities — the menu tree only has a
 * "Closures/Settings" slot under Swimming Pool, but Facility is one backend entity for both types, so
 * this single page covers hall creation/configuration too (resolved with the user via
 * `AskUserQuestion` before this slice was built, see Slice G plan §"Two placement decisions").
 */
export function FacilitySettingsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('__all__');
  const [editTarget, setEditTarget] = useState<FacilityDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [blackoutTarget, setBlackoutTarget] = useState<FacilityDto | null>(null);

  const { data, isFetching, refetch } = useFacilities({
    facilityType: typeFilter === '__all__' ? undefined : typeFilter,
    page: 1,
    pageSize: 100,
  });
  const [deactivate] = useDeactivateFacility();
  const [reactivate] = useReactivateFacility();

  async function toggleActive(facility: FacilityDto) {
    try {
      if (facility.isActive) {
        await deactivate({ id: facility.facilityId }).unwrap();
        toast.success(`${facility.name} deactivated.`);
      } else {
        await reactivate({ id: facility.facilityId }).unwrap();
        toast.success(`${facility.name} reactivated.`);
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Closures / Settings"
        crumbs={[{ label: 'Facilities' }, { label: 'Swimming Pool' }, { label: 'Closures / Settings' }]}
        actions={
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
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
          {isFetching ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : !data || data.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No facilities configured yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="p-3 text-start">Name</th>
                  <th className="p-3 text-start">Type</th>
                  <th className="p-3 text-start">Capacity</th>
                  <th className="p-3 text-start">Status</th>
                  <th className="p-3 text-start" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((facility) => (
                  <tr key={facility.facilityId} className="border-b last:border-0">
                    <td className="p-3 font-medium">{facility.name}</td>
                    <td className="p-3">{facility.facilityType}</td>
                    <td className="p-3">{facility.capacity}</td>
                    <td className="p-3">{facility.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="p-3">
                      <RequirePermission permission={PERMISSIONS.facility.manage}>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditTarget(facility)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setBlackoutTarget(facility)}>
                            Closures
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleActive(facility)}>
                            {facility.isActive ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </div>
                      </RequirePermission>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  const form = useForm<FacilitySchemaType>({
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
          minimumAgeUnaccompanied: facility.minimumAgeUnaccompanied ?? undefined,
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
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${facility?.name}` : 'Create facility'}</DialogTitle>
        </DialogHeader>
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
                {isCreating || isUpdating ? 'Saving…' : 'Save'}
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
