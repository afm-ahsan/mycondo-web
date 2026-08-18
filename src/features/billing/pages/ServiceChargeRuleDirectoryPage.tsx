import { useEffect, useRef, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { toUserMessage } from '@/api/errors';
import { FlatsMissingAreaNotice } from '../components/FlatsMissingAreaNotice';
import { ServiceChargeRuleFormDialog } from '../components/ServiceChargeRuleFormDialog';
import { ServiceChargeRuleManageDialog } from '../components/ServiceChargeRuleManageDialog';
import { formatDate, formatLabel } from '@/lib/helpers';
import { useServiceChargeRules } from '../api/serviceChargeRulesApi';
import { CALCULATION_METHOD_LABELS } from '../lib/constants';
import { ruleDisplayStatus } from '../lib/ruleStatus';
import type { ServiceChargeRuleDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Ended' | 'Inactive'> = {
  Active: { label: 'Active', variant: 'success' },
  Ended: { label: 'Ended', variant: 'warning' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
};

const RULES_FILTER_DEFAULTS = { buildingId: '', category: '', page: '1', pageSize: '10' };

export function ServiceChargeRuleDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
      setSearchParams(
        (params) => {
          params.delete('create');
          return params;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once on mount to consume the deep-link flag
  }, []);

  const [filters, setFilters] = useUrlFilters(RULES_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [category, setCategory] = useState(filters.category);
  const debouncedCategory = useDebouncedValue(category);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFilters({ category: debouncedCategory, page: '1' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the settled category should retrigger this
  }, [debouncedCategory]);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const [manageTarget, setManageTarget] = useState<ServiceChargeRuleDto | null>(null);

  const { data, isFetching, isError, error, refetch } = useServiceChargeRules(
    filters.buildingId
      ? {
          buildingId: filters.buildingId,
          category: debouncedCategory || undefined,
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
        }
      : skipToken,
  );
  const isSearchPending = category !== debouncedCategory;

  const columns: ColumnDef<ServiceChargeRuleDto>[] = [
    {
      id: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
      size: DATA_GRID_COLUMN_SIZE.flexible,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-muted-foreground text-xs">{row.original.category}</div>
        </div>
      ),
    },
    {
      id: 'calculationMethod',
      header: 'Method',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) =>
        CALCULATION_METHOD_LABELS[row.original.calculationMethod as keyof typeof CALCULATION_METHOD_LABELS] ??
        formatLabel(row.original.calculationMethod),
    },
    {
      id: 'rate',
      header: 'Rate',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <MoneyDisplay amount={row.original.rate} />,
    },
    {
      id: 'unitTypeFilter',
      header: 'Unit type',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.unitTypeFilter ?? 'All types',
    },
    {
      id: 'frequency',
      header: 'Frequency',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.frequency,
    },
    {
      id: 'effective',
      header: 'Effective',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => `${formatDate(row.original.effectiveFrom)} – ${row.original.effectiveTo ? formatDate(row.original.effectiveTo) : 'open'}`,
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <StatusBadge status={ruleDisplayStatus(row.original)} toneMap={statusToneMap} />,
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setManageTarget(row.original)}>
            Manage
          </Button>
        </div>
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
        title="Service Charge Rules"
        crumbs={[{ label: 'Finance' }, { label: 'Service Charges' }, { label: 'Rules' }]}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 w-full sm:w-64">
            <Label className="text-xs">Building</Label>
            <BuildingSelect
              value={filters.buildingId}
              onValueChange={(v) => setFilters({ buildingId: v, page: '1' })}
              placeholder="Select a building"
            />
          </div>
        </div>

        {filters.buildingId && <FlatsMissingAreaNotice buildingId={filters.buildingId} />}

        {isError ? (
          <Card>
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          </Card>
        ) : (
          <DataGrid
            table={table}
            recordCount={total}
            isLoading={isFetching}
            emptyMessage={filters.buildingId ? 'No service charge rules for this building yet.' : 'Select a building to view its rules.'}
            tableLayout={{ cellBorder: true }}
          >
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Rules</CardTitle>
                  <SearchInput
                    value={category}
                    onChange={setCategory}
                    placeholder="Search by category…"
                    isSearching={isSearchPending}
                    className="w-64"
                  />
                </CardHeading>
                <CardToolbar>
                  <RequirePermission permission={PERMISSIONS.billing.ruleManage}>
                    <Button disabled={!filters.buildingId} onClick={() => setCreateOpen(true)}>
                      <Plus /> New Rule
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
        )}
      </div>

      <ServiceChargeRuleManageDialog rule={manageTarget} onOpenChange={(open) => !open && setManageTarget(null)} />
      {filters.buildingId && (
        <ServiceChargeRuleFormDialog
          key={filters.buildingId}
          buildingId={filters.buildingId}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </>
  );
}
