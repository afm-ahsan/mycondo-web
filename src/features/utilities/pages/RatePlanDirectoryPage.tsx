import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RatePlanManageDialog } from '../components/RatePlanManageDialog';
import { useRatePlans } from '../api/ratePlansApi';
import type { UtilityType } from '../lib/constants';
import type { RatePlanDto } from '@/api/generated/mycondoApi';

interface RatePlanDirectoryPageProps {
  utilityType: UtilityType;
}

const statusToneMap: StatusBadgeMap<'Active' | 'Inactive'> = {
  Active: { label: 'Active', variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
};

const RATEPLAN_FILTER_DEFAULTS = { buildingId: '', page: '1', pageSize: '10' };

export function RatePlanDirectoryPage({ utilityType }: RatePlanDirectoryPageProps) {
  const [filters, setFilters] = useUrlFilters(RATEPLAN_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const [manageTarget, setManageTarget] = useState<RatePlanDto | null>(null);

  const { data, isFetching } = useRatePlans(
    filters.buildingId
      ? { buildingId: filters.buildingId, utilityType, page: pagination.pageIndex + 1, pageSize: pagination.pageSize }
      : skipToken,
  );

  const columns: ColumnDef<RatePlanDto>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'structure',
      header: 'Structure',
      cell: ({ row }) => row.original.structure,
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) =>
        row.original.structure === 'Fixed' ? (
          <MoneyDisplay amount={row.original.fixedAmount} />
        ) : (
          <span className="text-muted-foreground text-xs">{row.original.slabs.length} slab(s)</span>
        ),
    },
    {
      id: 'effective',
      header: 'Effective',
      cell: ({ row }) => `${row.original.effectiveFrom} – ${row.original.effectiveTo ?? 'open'}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'Active' : 'Inactive'} toneMap={statusToneMap} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => setManageTarget(row.original)}>
          Manage
        </Button>
      ),
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title={`${utilityType} Rate Plans`}
        crumbs={[{ label: 'Finance' }, { label: utilityType }, { label: 'Rate Plans' }]}
      />

      <div className="space-y-4">
        <div className="space-y-1.5 w-full sm:w-64">
          <Label className="text-xs">Building</Label>
          <BuildingSelect
            value={filters.buildingId}
            onValueChange={(v) => setFilters({ buildingId: v, page: '1' })}
            placeholder="Select a building"
          />
        </div>

        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage={filters.buildingId ? 'No rate plans for this building yet.' : 'Select a building to view its rate plans.'}
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Rate Plans</CardTitle>
              </CardHeading>
              <CardToolbar>
                <RequirePermission permission={PERMISSIONS.utility.ratePlanManage}>
                  <Button asChild disabled={!filters.buildingId}>
                    <Link to={filters.buildingId ? `/utilities/${utilityType.toLowerCase()}/rate-plans/new?buildingId=${filters.buildingId}` : '#'}>
                      <Plus /> New Rate Plan
                    </Link>
                  </Button>
                </RequirePermission>
              </CardToolbar>
            </CardHeader>
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter>
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      </div>

      <RatePlanManageDialog ratePlan={manageTarget} onOpenChange={(open) => !open && setManageTarget(null)} />
    </>
  );
}
