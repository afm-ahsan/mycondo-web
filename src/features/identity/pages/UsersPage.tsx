import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toUserMessage } from '@/api/errors';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { useDisableUser, useUsers } from '../api/identityApi';

const USERS_COLUMN_COUNT = 4;

export function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const [disableUser, { isLoading: isDisabling }] = useDisableUser();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  async function handleDisable(userId: string) {
    try {
      await disableUser({ id: userId }).unwrap();
      toast.success('User disabled.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with an account in this tenant."
        crumbs={[{ label: 'Administration' }, { label: 'Users' }]}
      />
      <Card>
      <CardContent>
        {isError && (
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        )}

        {!isError && !isLoading && users?.length === 0 && (
          <EmptyState title="No users yet" description="Users appear here once someone registers for this tenant." />
        )}

        {!isError && (isLoading || (users && users.length > 0)) && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <RequirePermission permission="user.disable">
                  <TableHead className="text-right">Actions</TableHead>
                </RequirePermission>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={USERS_COLUMN_COUNT} />
              ) : (
                users!.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'destructive'} appearance="light">
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <RequirePermission permission="user.disable">
                      <TableCell className="text-right">
                        {user.isActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDisabling}
                            onClick={() => setPendingUserId(user.userId)}
                          >
                            Disable
                          </Button>
                        )}
                      </TableCell>
                    </RequirePermission>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <AlertDialog open={pendingUserId !== null} onOpenChange={(open) => !open && setPendingUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable this user?</AlertDialogTitle>
              <AlertDialogDescription>
                They will no longer be able to sign in. This cannot be undone from here.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => pendingUserId && handleDisable(pendingUserId)}
                disabled={isDisabling}
              >
                Disable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
      </Card>
    </>
  );
}
