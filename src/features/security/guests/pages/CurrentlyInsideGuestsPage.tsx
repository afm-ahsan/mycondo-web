import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toUserMessage } from '@/api/errors';
import { useCurrentlyInsideAccessSessions } from '../api/guestsApi';

export function CurrentlyInsideGuestsPage() {
  const { data, isLoading, isError, error } = useCurrentlyInsideAccessSessions({
    category: 'Guest',
    page: 1,
    pageSize: 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guests Currently Inside</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSpinner label="Loading current visitors…" />}

        {isError && <p className="text-sm text-destructive py-6">{toUserMessage(error)}</p>}

        {!isLoading && !isError && data?.items.length === 0 && (
          <EmptyState title="No guests currently inside" />
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host flat</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Entry gate</TableHead>
                <TableHead>Entry time</TableHead>
                <TableHead>Checked in by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((session) => (
                <TableRow key={session.accessSessionId}>
                  <TableCell>{session.hostFlatId ?? '—'}</TableCell>
                  <TableCell>{session.purposeOfVisit ?? '—'}</TableCell>
                  <TableCell>{session.entryGateId}</TableCell>
                  <TableCell>{new Date(session.entryAtUtc).toLocaleString()}</TableCell>
                  <TableCell>{session.checkedInBy ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
