import { useState } from 'react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatTimeOfDay } from '../../lib/format';
import { useCheckOutPoolSession, usePoolSessions } from '../../api/poolApi';
import { CapacityIndicator } from '../../components/CapacityIndicator';
import { PageHeader } from '@/components/shared/PageHeader';
import { useFacilities } from '../../api/facilitiesApi';

export function CurrentOccupancyPage() {
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const { data: poolsData } = useFacilities({ facilityType: 'SwimmingPool', page: 1, pageSize: 100 });
  const facility = poolsData?.items.find((f) => f.facilityId === facilityId);

  const { data, isFetching, refetch } = usePoolSessions(
    { facilityId, openOnly: true, page: 1, pageSize: 100 },
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
            <FacilitySelect facilityType="SwimmingPool" value={facilityId} onValueChange={setFacilityId} placeholder="All pools" />
          </CardToolbar>
        </CardHeader>
        {facility && (
          <div className="px-6 pb-4">
            <CapacityIndicator current={data ? Number(data.total) : 0} capacity={Number(facility.capacity)} />
          </div>
        )}
        <CardTable>
          {isFetching ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : !data || data.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No one is currently in the pool.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-start text-muted-foreground">
                  <th className="p-3 text-start">Flat</th>
                  <th className="p-3 text-start">Type</th>
                  <th className="p-3 text-start">Age</th>
                  <th className="p-3 text-start">Entry</th>
                  <th className="p-3 text-start" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((session) => (
                  <tr key={session.poolSessionId} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{session.flatId.slice(0, 8)}</td>
                    <td className="p-3">{session.personType}</td>
                    <td className="p-3">{session.ageCategory}</td>
                    <td className="p-3">{formatTimeOfDay(session.entryAtUtc)}</td>
                    <td className="p-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardTable>
      </Card>
    </div>
  );
}
