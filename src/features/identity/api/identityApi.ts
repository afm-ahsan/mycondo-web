import {
  useDeleteApiV1RolesByIdAssignmentsAndUserIdMutation,
  useDeleteApiV1RolesByIdMutation,
  useDeleteApiV1RolesByIdPermissionsAndPermissionIdMutation,
  useGetApiV1PermissionsQuery,
  useGetApiV1RolesByIdAssignmentsQuery,
  useGetApiV1RolesByIdPermissionsQuery,
  useGetApiV1RolesQuery,
  useGetApiV1UsersQuery,
  usePostApiV1RolesByIdAssignmentsMutation,
  usePostApiV1RolesByIdPermissionsMutation,
  usePostApiV1RolesMutation,
  usePostApiV1UsersByIdDisableMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see src/features/auth/api/authApi.ts
// for the same pattern.
export const useUsers = useGetApiV1UsersQuery;
export const useDisableUser = usePostApiV1UsersByIdDisableMutation;

export const useRoles = useGetApiV1RolesQuery;
export const usePermissions = useGetApiV1PermissionsQuery;
export const useCreateRole = usePostApiV1RolesMutation;
export const useDeactivateRole = useDeleteApiV1RolesByIdMutation;
export const useGrantPermissionToRole = usePostApiV1RolesByIdPermissionsMutation;
export const useRemovePermissionFromRole = useDeleteApiV1RolesByIdPermissionsAndPermissionIdMutation;
export const useAssignRoleToUser = usePostApiV1RolesByIdAssignmentsMutation;
export const useRevokeRoleFromUser = useDeleteApiV1RolesByIdAssignmentsAndUserIdMutation;
export const useRolePermissions = useGetApiV1RolesByIdPermissionsQuery;
export const useRoleAssignments = useGetApiV1RolesByIdAssignmentsQuery;
