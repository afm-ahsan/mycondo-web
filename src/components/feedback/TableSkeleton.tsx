import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

interface TableSkeletonProps {
  /** How many columns the surrounding table has (one skeleton bar per cell). */
  columns: number;
  /** How many placeholder rows to render while the first page of data loads. */
  rows?: number;
}

/**
 * Placeholder rows for a table's initial load, so the page keeps its shape instead of jumping when
 * real rows arrive. Drop inside the existing `<TableBody>` in place of the mapped rows:
 * `{isLoading ? <TableSkeleton columns={4} /> : data.map(...)}`.
 */
export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full max-w-40" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
