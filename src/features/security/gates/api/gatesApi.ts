import {
  useGetApiV1PropertiesBuildingsByBuildingIdGatesQuery,
  usePostApiV1PropertiesBuildingsByBuildingIdGatesAndGateIdActivateMutation,
  usePostApiV1PropertiesBuildingsByBuildingIdGatesAndGateIdDeactivateMutation,
  usePostApiV1PropertiesBuildingsByBuildingIdGatesMutation,
  usePutApiV1PropertiesBuildingsByBuildingIdGatesAndGateIdMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see src/features/auth/api/authApi.ts
// for the same pattern.
export const useGates = useGetApiV1PropertiesBuildingsByBuildingIdGatesQuery;
export const useCreateGate = usePostApiV1PropertiesBuildingsByBuildingIdGatesMutation;
export const useUpdateGate = usePutApiV1PropertiesBuildingsByBuildingIdGatesAndGateIdMutation;
export const useActivateGate = usePostApiV1PropertiesBuildingsByBuildingIdGatesAndGateIdActivateMutation;
export const useDeactivateGate = usePostApiV1PropertiesBuildingsByBuildingIdGatesAndGateIdDeactivateMutation;
