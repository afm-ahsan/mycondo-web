import { Card, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { toUserMessage } from '@/api/errors';
import { formatDate } from '@/lib/helpers';
import { useMyFlats } from '../api/meApi';
import { relationshipTypeToneMap, type RelationshipType } from '../lib/relationshipType';

const MY_FLATS_COLUMN_COUNT = 5;

/**
 * Self-service view of the caller's own owned/occupied flats — backed by mycondo-api's
 * GET /api/v1/me/flats (Phase 3, mycondo-docs ADR-021). Deliberately shows only what the backend
 * decides belongs to the caller (Role + Building Scope + active FlatOwnership/occupancy relationship)
 * — there is no filter/selector here to reach into any other flat.
 */
export function MyFlatsPage() {
  const { data, isFetching, isError, error, refetch } = useMyFlats();

  return (
    <>
      <PageHeader title="My Flat" crumbs={[{ label: 'My Flat' }]} />
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>My flats</CardTitle>
          </CardHeading>
        </CardHeader>
        <CardTable>
          {isError ? (
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          ) : !isFetching && (!data || data.length === 0) ? (
            <EmptyState
              title="No flats found"
              description="You don't currently hold an active ownership or occupancy relationship to any flat."
            />
          ) : (
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Ends</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableSkeleton columns={MY_FLATS_COLUMN_COUNT} />
                  ) : (
                    (data ?? []).map((flat) => (
                      <TableRow key={`${flat.flatId}-${flat.relationshipType}`}>
                        <TableCell className="font-medium">{flat.flatNumber}</TableCell>
                        <TableCell>{flat.buildingName}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={flat.relationshipType as RelationshipType}
                            toneMap={relationshipTypeToneMap}
                          />
                        </TableCell>
                        <TableCell>{flat.startDate ? formatDate(flat.startDate) : '—'}</TableCell>
                        <TableCell>{flat.endDate ? formatDate(flat.endDate) : '—'}</TableCell>
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
    </>
  );
}
