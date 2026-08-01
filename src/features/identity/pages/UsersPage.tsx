import { useState } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
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
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { useDisableUser, useUsers } from '../api/identityApi';

export function UsersPage() {
  const { data: users, isLoading, isError, error } = useUsers();
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
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-6">
            <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Loading users...
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive py-6">{toUserMessage(error)}</p>
        )}

        {!isLoading && !isError && users?.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">No users yet.</p>
        )}

        {!isLoading && !isError && users && users.length > 0 && (
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
              {users.map((user) => (
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
              ))}
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
  );
}
