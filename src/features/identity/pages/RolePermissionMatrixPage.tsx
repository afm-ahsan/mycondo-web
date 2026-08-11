import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PageHeader } from '@/components/shared/PageHeader';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import {
  useAssignRoleToUser,
  useCreateRole,
  useGrantPermissionToRole,
  usePermissions,
  useRemovePermissionFromRole,
  useRevokeRoleFromUser,
  useRoleAssignments,
  useRolePermissions,
  useRoles,
  useUsers,
} from '../api/identityApi';

const createRoleSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(80),
  description: z.string().max(400).optional(),
});
type CreateRoleSchemaType = z.infer<typeof createRoleSchema>;

export function RolePermissionMatrixPage() {
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const selectedRole = roles?.find((r) => r.roleId === selectedRoleId) ?? null;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Manage roles, their permission grants, and who holds them."
        crumbs={[{ label: 'Administration' }, { label: 'Roles & Permissions' }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles</CardTitle>
          <RequirePermission permission="role.manage">
            <CreateRoleDialog onCreated={setSelectedRoleId} />
          </RequirePermission>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoadingRoles && (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <InlineSpinner /> Loading roles...
            </div>
          )}
          {roles?.map((role) => (
            <button
              key={role.roleId}
              type="button"
              onClick={() => setSelectedRoleId(role.roleId)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-accent ${
                role.roleId === selectedRoleId ? 'bg-accent' : ''
              }`}
            >
              <span>{role.name}</span>
              <span className="flex items-center gap-1">
                {role.requiresBuildingScope === true && (
                  <Badge variant="secondary" appearance="light">
                    Building-scoped
                  </Badge>
                )}
                {role.requiresBuildingScope === false && (
                  <Badge variant="secondary" appearance="light">
                    Organization-wide
                  </Badge>
                )}
                {role.isSystem && (
                  <Badge variant="info" appearance="light">
                    System
                  </Badge>
                )}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        {selectedRole ? (
          <>
            <RolePermissionsPanel roleId={selectedRole.roleId} roleName={selectedRole.name} />
            <RoleAssignmentsPanel
              roleId={selectedRole.roleId}
              roleName={selectedRole.name}
              requiresBuildingScope={selectedRole.requiresBuildingScope ?? null}
            />
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Select a role to manage its permissions and assignments.
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </>
  );
}

function CreateRoleDialog({ onCreated }: { onCreated: (roleId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [createRole, { isLoading }] = useCreateRole();

  const form = useForm<CreateRoleSchemaType>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '' },
  });

  async function onSubmit(values: CreateRoleSchemaType) {
    try {
      const result = await createRole({
        createRoleCommand: { name: values.name, description: values.description ?? '' },
      }).unwrap();
      toast.success(`Role "${result.name}" created.`);
      onCreated(result.roleId);
      form.reset();
      setOpen(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="h-4 w-4" /> New role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Building Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RolePermissionsPanel({ roleId, roleName }: { roleId: string; roleName: string }) {
  const { data: catalogue, isLoading: isLoadingCatalogue } = usePermissions();
  const { data: granted, isLoading: isLoadingGranted } = useRolePermissions({ id: roleId });
  const [grantPermission] = useGrantPermissionToRole();
  const [removePermission] = useRemovePermissionFromRole();
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(null);

  const grantedIds = useMemo(() => new Set(granted?.map((p) => p.id) ?? []), [granted]);

  const byModule = useMemo(() => {
    const groups = new Map<string, typeof catalogue>();
    for (const permission of catalogue ?? []) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }
    return groups;
  }, [catalogue]);

  async function toggle(permissionId: string, isGranted: boolean) {
    setPendingPermissionId(permissionId);
    try {
      if (isGranted) {
        await removePermission({ id: roleId, permissionId }).unwrap();
      } else {
        await grantPermission({
          id: roleId,
          grantPermissionToRoleRequest: { permissionId },
        }).unwrap();
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setPendingPermissionId(null);
    }
  }

  const isLoading = isLoadingCatalogue || isLoadingGranted;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions — {roleName}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <InlineSpinner /> Loading permissions...
          </div>
        )}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-h-96 overflow-y-auto">
            {Array.from(byModule.entries()).map(([module, permissions]) => (
              <div key={module}>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{module}</p>
                <div className="space-y-1.5">
                  {permissions?.map((permission) => {
                    const isGranted = grantedIds.has(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <RequirePermission
                          permission="role.manage"
                          fallback={<Checkbox checked={isGranted} disabled size="sm" />}
                        >
                          <Checkbox
                            checked={isGranted}
                            disabled={pendingPermissionId === permission.id}
                            onCheckedChange={() => toggle(permission.id, isGranted)}
                            size="sm"
                          />
                        </RequirePermission>
                        {permission.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RoleAssignmentsPanel({
  roleId,
  roleName,
  requiresBuildingScope,
}: {
  roleId: string;
  roleName: string;
  /** true = every assignment must carry a Building (condominium-scoped system roles); false = no
   * assignment may carry one (OrganizationAdmin); null/undefined = no constraint, matching every
   * pre-Phase-2 role's behavior (custom roles, legacy tenant SuperAdmin). */
  requiresBuildingScope: boolean | null;
}) {
  const { data: assignments, isLoading: isLoadingAssignments } = useRoleAssignments({ id: roleId });
  // pageSize 200 — this dropdown needs every active tenant user, not one page of them; tenant scale
  // here (a single condominium's staff/owners) makes that a reasonable ceiling. See UsersPage for the
  // paginated register-style view of the same data.
  const { data: usersPage } = useUsers({ isActive: true, pageSize: 200 });
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleToUser();
  const [revokeRole] = useRevokeRoleFromUser();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [buildingId, setBuildingId] = useState<string | undefined>(undefined);

  const assignedUserIds = new Set(assignments?.map((a) => a.userId) ?? []);
  const assignableUsers = usersPage?.items ?? [];
  const buildingRequired = requiresBuildingScope === true;
  const buildingForbidden = requiresBuildingScope === false;
  const canAssign = selectedUserId && (!buildingRequired || buildingId);

  async function handleAssign() {
    if (!canAssign) return;
    try {
      await assignRole({
        id: roleId,
        assignRoleToUserRequest: { userId: selectedUserId, buildingId: buildingForbidden ? null : (buildingId ?? null) },
      }).unwrap();
      toast.success('Role assigned.');
      setSelectedUserId('');
      setBuildingId(undefined);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleRevoke(userId: string, userBuildingId?: string) {
    try {
      await revokeRole({ id: roleId, userId, buildingId: userBuildingId }).unwrap();
      toast.success('Role revoked.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments — {roleName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingAssignments && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <InlineSpinner /> Loading assignments...
          </div>
        )}

        {!isLoadingAssignments && assignments?.length === 0 && (
          <p className="text-sm text-muted-foreground">No one holds this role yet.</p>
        )}

        <div className="space-y-1.5">
          {assignments?.map((assignment) => (
            <div
              key={`${assignment.userId}-${assignment.buildingId ?? 'tenant-wide'}`}
              className="flex items-center justify-between text-sm border-b py-1.5"
            >
              <span>
                {assignment.fullName} ({assignment.email})
                {assignment.buildingId && (
                  <span className="text-muted-foreground"> — building {assignment.buildingId}</span>
                )}
              </span>
              <RequirePermission permission="role.manage">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(assignment.userId, assignment.buildingId ?? undefined)}
                >
                  Revoke
                </Button>
              </RequirePermission>
            </div>
          ))}
        </div>

        <RequirePermission permission="role.manage">
          <div className="flex flex-wrap items-end gap-2 pt-2">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers
                    .filter((u) => !assignedUserIds.has(u.userId) || buildingId)
                    .map((u) => (
                      <SelectItem key={u.userId} value={u.userId}>
                        {u.fullName} ({u.email})
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
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </RequirePermission>
      </CardContent>
    </Card>
  );
}
