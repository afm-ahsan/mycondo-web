import { useState } from 'react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import {
  useAssignRoleToUser,
  useRevokeRoleFromUser,
  useRoles,
  useUserRoleAssignments,
} from '../api/identityApi';

interface ManageUserRolesDialogProps {
  userId: string;
  userFullName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Per-user role/scope assignment, reusing the same AssignRoleToUser/RevokeRoleFromUser mutations
 * and building-scope tri-state rules as RolePermissionMatrixPage's RoleAssignmentsPanel — just
 * pivoted around a fixed user instead of a fixed role. */
export function ManageUserRolesDialog({ userId, userFullName, open, onOpenChange }: ManageUserRolesDialogProps) {
  const { data: assignments, isLoading: isLoadingAssignments } = useUserRoleAssignments(
    { id: userId },
    { skip: !open },
  );
  const { data: roles } = useRoles(undefined, { skip: !open });
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleToUser();
  const [revokeRole] = useRevokeRoleFromUser();
  const [pendingRevokeKey, setPendingRevokeKey] = useState<string | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [buildingId, setBuildingId] = useState<string | undefined>(undefined);

  const selectedRole = roles?.find((r) => r.roleId === selectedRoleId);
  const buildingRequired = selectedRole?.requiresBuildingScope === true;
  const buildingForbidden = selectedRole?.requiresBuildingScope === false;
  const canAssign = Boolean(selectedRoleId) && (!buildingRequired || Boolean(buildingId));

  async function handleAssign() {
    if (!canAssign) return;
    try {
      await assignRole({
        id: selectedRoleId,
        assignRoleToUserRequest: { userId, buildingId: buildingForbidden ? null : (buildingId ?? null) },
      }).unwrap();
      toast.success('Role assigned.');
      setSelectedRoleId('');
      setBuildingId(undefined);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleRevoke(roleId: string, roleBuildingId: string | undefined | null) {
    const key = `${roleId}-${roleBuildingId ?? 'tenant-wide'}`;
    setPendingRevokeKey(key);
    try {
      await revokeRole({ id: roleId, userId, buildingId: roleBuildingId ?? undefined }).unwrap();
      toast.success('Role revoked.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setPendingRevokeKey(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roles &amp; Permissions — {userFullName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoadingAssignments && (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <InlineSpinner /> Loading roles...
            </div>
          )}

          {!isLoadingAssignments && assignments?.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
          )}

          <div className="space-y-1.5">
            {assignments?.map((assignment) => {
              const key = `${assignment.roleId}-${assignment.buildingId ?? 'tenant-wide'}`;
              return (
                <div key={key} className="flex items-center justify-between text-sm border-b py-1.5">
                  <span>
                    {assignment.roleName}
                    {assignment.buildingId && (
                      <span className="text-muted-foreground"> — building {assignment.buildingId}</span>
                    )}
                  </span>
                  <RequirePermission permission="role.manage">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingRevokeKey === key}
                      onClick={() => handleRevoke(assignment.roleId, assignment.buildingId)}
                    >
                      Revoke
                    </Button>
                  </RequirePermission>
                </div>
              );
            })}
          </div>

          <RequirePermission permission="role.manage">
            <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-muted-foreground">Role</label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.roleId} value={role.roleId}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!buildingForbidden && (
                <div className="w-56">
                  <label className="text-xs text-muted-foreground">
                    Building{buildingRequired ? '' : ' (optional — leave blank for tenant-wide)'}
                  </label>
                  <BuildingSelect
                    value={buildingId}
                    onValueChange={setBuildingId}
                    placeholder={buildingRequired ? 'Select a building' : 'Tenant-wide'}
                  />
                </div>
              )}
              <Button onClick={handleAssign} disabled={!canAssign || isAssigning}>
                {isAssigning ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          </RequirePermission>
        </div>
      </DialogContent>
    </Dialog>
  );
}
