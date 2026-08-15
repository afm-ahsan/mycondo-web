import { Waves } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatTimeOfDay } from '../../lib/format';
import { useCheckOutPoolSession, usePoolSessions } from '../../api/poolApi';
import { CapacityIndicator } from '../../components/CapacityIndicator';
import { PageHeader } from '@/components/shared/PageHeader';
import { useFacilities } from '../../api/facilitiesApi';

const OCCUPANCY_COLUMN_COUNT = 5;

/**
 * `pageSize: 100` here is not a truncation risk to fix — current pool occupancy is inherently
 * capacity-bound (a pool holds at most its configured `capacity`, always far below 100 concurrent
 * sessions), not a growing list that needs real pagination.
 */
const OCCUPANCY_FILTER_DEFAULTS = { facilityId: '' };

export function CurrentOccupancyPage() {
  const [filters, setFilters] = useUrlFilters(OCCUPANCY_FILTER_DEFAULTS);
  const { data: poolsData } = useFacilities({ facilityType: 'SwimmingPool', page: 1, pageSize: 100 });
  const facility = poolsData?.items.find((f) => f.facilityId === filters.facilityId);

  const { data, isFetching, refetch } = usePoolSessions(
    { facilityId: filters.facilityId || undefined, openOnly: true, page: 1, pageSize: 100 },
  );
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutPoolSession();

  async function handleCheckOut(id: string) {
    try {
      await checkOut({ id }).unwrap();
      toast.success('Checked out.');
      refetch();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Current Users" crumbs={[{ label: 'Facilities' }, { label: 'Swimming Pool' }, { label: 'Current Users' }]} />

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Currently in the pool</CardTitle>
          </CardHeading>
          <CardToolbar>
            <FacilitySelect
              facilityType="SwimmingPool"
              value={filters.facilityId || undefined}
              onValueChange={(id) => setFilters({ facilityId: id })}
              placeholder="All pools"
            />
          </CardToolbar>
        </CardHeader>
        {facility && (
          <div className="px-6 pb-4">
            <CapacityIndicator current={data ? Number(data.total) : 0} capacity={Number(facility.capacity)} />
          </div>
        )}
        <CardTable>
          {!isFetching && (!data || data.items.length === 0) ? (
            <EmptyState
              icon={<Waves className="size-8" aria-hidden="true" />}
              title="No one is currently in the pool"
              description="Checked-in residents and guests will appear here."
            />
          ) : (
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableSkeleton columns={OCCUPANCY_COLUMN_COUNT} />
                  ) : (
                    (data?.items ?? []).map((session) => (
                      <TableRow key={session.poolSessionId}>
                        <TableCell className="font-mono text-xs">{session.flatId.slice(0, 8)}</TableCell>
                        <TableCell>{session.personType}</TableCell>
                        <TableCell>{session.ageCategory}</TableCell>
                        <TableCell>{formatTimeOfDay(session.entryAtUtc)}</TableCell>
                        <TableCell>
                          <RequirePermission permission={PERMISSIONS.pool.checkout}>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCheckingOut}
                              onClick={() => handleCheckOut(session.poolSessionId)}
                            >
                              Check Out
                            </Button>
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
    </div>
  );
}
