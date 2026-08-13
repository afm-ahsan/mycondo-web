import {
  useGetApiV1PropertiesFlatOwnershipsQuery,
  useGetApiV1PropertiesOwnersByResidentIdOwnershipsQuery,
  useGetApiV1ResidentsByIdQuery,
  useGetApiV1ResidentsQuery,
  usePostApiV1PropertiesFlatOwnershipsMutation,
  usePostApiV1PropertiesFlatOwnershipsRegisterMutation,
  usePostApiV1ResidentsByIdDisableMutation,
  usePostApiV1ResidentsByIdLinkUserMutation,
  usePostApiV1ResidentsMutation,
  usePutApiV1PropertiesFlatOwnershipsOwnersByResidentIdProfileMutation,
  usePutApiV1ResidentsByIdMutation,
  useDeleteApiV1PropertiesFlatOwnershipsByIdMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see src/features/auth/api/authApi.ts
// for the same pattern. FlatOwnership hooks are colocated here (rather than under a dedicated
// `features/property/` folder) since the Property module's frontend surface, so far, is exactly this
// one workflow — the Flat Owners register consumed by this feature's pages.
export const useResidents = useGetApiV1ResidentsQuery;
export const useResident = useGetApiV1ResidentsByIdQuery;
export const useCreateResident = usePostApiV1ResidentsMutation;
export const useUpdateResident = usePutApiV1ResidentsByIdMutation;
export const useDisableResident = usePostApiV1ResidentsByIdDisableMutation;
export const useLinkResidentToUser = usePostApiV1ResidentsByIdLinkUserMutation;

export const useFlatOwners = useGetApiV1PropertiesFlatOwnershipsQuery;
export const useFlatOwnershipsForOwner = useGetApiV1PropertiesOwnersByResidentIdOwnershipsQuery;
export const useCreateFlatOwnership = usePostApiV1PropertiesFlatOwnershipsMutation;
export const useRegisterFlatOwner = usePostApiV1PropertiesFlatOwnershipsRegisterMutation;
export const useUpdateFlatOwnerProfile = usePutApiV1PropertiesFlatOwnershipsOwnersByResidentIdProfileMutation;
export const useEndFlatOwnership = useDeleteApiV1PropertiesFlatOwnershipsByIdMutation;
