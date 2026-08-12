import {
  useDeleteApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdMutation,
  useDeleteApiV1PropertiesBuildingsByIdMutation,
  useGetApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdQuery,
  useGetApiV1PropertiesBuildingsByBuildingIdFlatsQuery,
  useGetApiV1PropertiesBuildingsByIdQuery,
  useGetApiV1PropertiesBuildingsQuery,
  usePostApiV1PropertiesBuildingsByBuildingIdFlatsMutation,
  usePostApiV1PropertiesBuildingsMutation,
  usePutApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdMutation,
  usePutApiV1PropertiesBuildingsByIdMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see src/features/auth/api/authApi.ts
// for the same pattern.
export const useBuildings = useGetApiV1PropertiesBuildingsQuery;
export const useBuilding = useGetApiV1PropertiesBuildingsByIdQuery;
export const useCreateBuilding = usePostApiV1PropertiesBuildingsMutation;
export const useUpdateBuilding = usePutApiV1PropertiesBuildingsByIdMutation;
export const useDeactivateBuilding = useDeleteApiV1PropertiesBuildingsByIdMutation;

export const useFlatsForBuilding = useGetApiV1PropertiesBuildingsByBuildingIdFlatsQuery;
export const useFlat = useGetApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdQuery;
export const useCreateFlat = usePostApiV1PropertiesBuildingsByBuildingIdFlatsMutation;
export const useUpdateFlat = usePutApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdMutation;
export const useDeactivateFlat = useDeleteApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdMutation;
