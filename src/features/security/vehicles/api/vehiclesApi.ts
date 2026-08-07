import {
  useGetApiV1AccessSessionsCurrentlyInsideQuery,
  useGetApiV1VehiclesByIdTripsQuery,
  useGetApiV1VehiclesByRegistrationByRegistrationNumberQuery,
  useGetApiV1VehiclesQuery,
  usePostApiV1AccessSessionsVehiclesByIdCheckoutMutation,
  usePostApiV1AccessSessionsVehiclesCheckinMutation,
  usePostApiV1VehiclesByIdBlockMutation,
  usePostApiV1VehiclesByIdUnblockMutation,
  usePostApiV1VehiclesMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005), mirroring guestsApi.ts's pattern.
export const useRegisterVehicle = usePostApiV1VehiclesMutation;
export const useVehicles = useGetApiV1VehiclesQuery;
export const useVehicleByRegistration = useGetApiV1VehiclesByRegistrationByRegistrationNumberQuery;
export const useBlockVehicle = usePostApiV1VehiclesByIdBlockMutation;
export const useUnblockVehicle = usePostApiV1VehiclesByIdUnblockMutation;
export const useVehicleTrips = useGetApiV1VehiclesByIdTripsQuery;
export const useCheckInVehicle = usePostApiV1AccessSessionsVehiclesCheckinMutation;
export const useCheckOutVehicle = usePostApiV1AccessSessionsVehiclesByIdCheckoutMutation;
export const useCurrentlyInsideAccessSessions = useGetApiV1AccessSessionsCurrentlyInsideQuery;
