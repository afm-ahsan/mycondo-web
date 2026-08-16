import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Car, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { toUserMessage } from '@/api/errors';
import { useOccupancySecurityView, useOccupancySecurityViews } from '../api/leasingApi';
import { PageHeader } from '@/components/shared/PageHeader';

/**
 * Priority 2D — the restricted security-facing directory. Deliberately its own page (not a
 * permission-filtered view of the management list/detail pages) so security staff never even load
 * the full `OccupancyRegistrationDto` — every request here goes through the dedicated
 * `occupancy-registration.security-view` endpoints, which structurally cannot return NID/passport/
 * address/lease data (see `OccupancyRegistrationSecurityViewDto` on the backend). Always scoped to
 * Active occupancies server-side.
 */
export function SecurityDirectoryPage() {
  const [buildingId, setBuildingId] = useState<string | undefined>();
  const [flatId, setFlatId] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isFetching, isError, error, refetch } = useOccupancySecurityViews({ flatId, page: 1, pageSize: 50 });
  const { data: detail } = useOccupancySecurityView(selectedId ? { id: selectedId } : skipToken);

  return (
    <>
      <PageHeader title="Security Directory" crumbs={[{ label: 'Security Directory' }]} />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-48">
          <BuildingSelect
            value={buildingId}
            onValueChange={(id) => {
              setBuildingId(id);
              setFlatId(undefined);
            }}
            placeholder="All buildings"
          />
        </div>
        <div className="w-48">
          <FlatSelect buildingId={buildingId} value={flatId} onValueChange={setFlatId} placeholder="All flats" />
        </div>
      </div>

      {isError ? (
        <ErrorState description={toUserMessage(error)} onRetry={refetch} />
      ) : isFetching && !data ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<UserRound className="size-8" aria-hidden="true" />}
          title="No active occupancies found"
          description={
            buildingId || flatId
              ? 'No active residents match the selected building and flat filters.'
              : 'No residents currently have an active occupancy in this property.'
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((item) => (
            <Card
              key={item.occupancyRegistrationId}
              className="hover:border-primary cursor-pointer transition-colors"
              onClick={() => setSelectedId(item.occupancyRegistrationId)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div className="bg-accent flex size-10 items-center justify-center rounded-full">
                  <UserRound className="text-muted-foreground size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.primaryFullName}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.buildingName} · {item.flatNumber}
                  </p>
                </div>
                {item.accessEligible && (
                  <Badge variant="success" appearance="light">
                    <ShieldCheck className="size-3" /> Access
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{detail?.primaryFullName ?? 'Loading…'}</SheetTitle>
          </SheetHeader>
          {detail && (
            <SheetBody className="space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Badge variant={detail.accessEligible ? 'success' : 'secondary'} appearance="light">
                  {detail.accessEligible ? 'Access Eligible' : 'No Active Access'}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {detail.buildingName} · {detail.flatNumber}
                </span>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Household Members
                </h4>
                {detail.householdMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">None on file.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.householdMembers.map((m, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{m.fullName}</span>
                        <span className="text-muted-foreground text-xs">{m.relationshipToPrimary}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <UserRound className="size-3.5" /> Workers & Drivers
                </h4>
                {detail.workers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">None assigned.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.workers.map((w, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>
                          {w.fullName} ({w.workerType})
                        </span>
                        <span className="text-muted-foreground text-xs">{w.verificationStatus}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Car className="size-3.5" /> Vehicles
                </h4>
                {detail.vehicles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">None assigned.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.vehicles.map((v, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{v.registrationNumber}</span>
                        <span className="text-muted-foreground text-xs">{v.vehicleType}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SheetBody>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
