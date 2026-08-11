import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { useUser, useUserRoleAssignments } from '../api/identityApi';

interface ViewUserDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewUserDialog({ userId, open, onOpenChange }: ViewUserDialogProps) {
  const { data: user, isLoading: isLoadingUser } = useUser({ id: userId }, { skip: !open });
  const { data: roleAssignments, isLoading: isLoadingRoles } = useUserRoleAssignments(
    { id: userId },
    { skip: !open },
  );

  const isLoading = isLoadingUser || isLoadingRoles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user?.fullName ?? 'User details'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-6">
            <InlineSpinner /> Loading...
          </div>
        ) : user ? (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-3 gap-y-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="col-span-2">{user.email}</dd>
              <dt className="text-muted-foreground">Mobile</dt>
              <dd className="col-span-2">{user.phoneNumber ?? '—'}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">
                <Badge variant={user.isActive ? 'success' : 'destructive'} appearance="light">
                  {user.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">Last login</dt>
              <dd className="col-span-2">
                {user.lastLoginAtUtc ? new Date(user.lastLoginAtUtc).toLocaleString() : 'Never'}
              </dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="col-span-2">{new Date(user.createdAtUtc).toLocaleString()}</dd>
            </dl>

            <div>
              <p className="text-muted-foreground mb-1.5">Roles</p>
              {roleAssignments && roleAssignments.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {roleAssignments.map((assignment) => (
                    <Badge key={`${assignment.roleId}-${assignment.buildingId ?? 'tenant-wide'}`} variant="secondary" appearance="light">
                      {assignment.roleName}
                      {assignment.buildingId ? ' (building-scoped)' : ''}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No roles assigned yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
