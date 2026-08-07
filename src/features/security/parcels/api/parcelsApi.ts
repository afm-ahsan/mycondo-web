import {
  useGetApiV1ParcelsByIdCustodyHistoryQuery,
  useGetApiV1ParcelsByIdQuery,
  useGetApiV1ParcelsQuery,
  usePostApiV1ParcelsByIdCloseMutation,
  usePostApiV1ParcelsByIdCollectMutation,
  usePostApiV1ParcelsByIdDamagedMutation,
  usePostApiV1ParcelsByIdNotifyMutation,
  usePostApiV1ParcelsMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005), mirroring vehiclesApi.ts's pattern.
export const useReceiveParcel = usePostApiV1ParcelsMutation;
export const useParcels = useGetApiV1ParcelsQuery;
export const useParcel = useGetApiV1ParcelsByIdQuery;
export const useParcelCustodyHistory = useGetApiV1ParcelsByIdCustodyHistoryQuery;
export const useNotifyResident = usePostApiV1ParcelsByIdNotifyMutation;
export const useCollectParcel = usePostApiV1ParcelsByIdCollectMutation;
export const useMarkParcelDamaged = usePostApiV1ParcelsByIdDamagedMutation;
export const useCloseParcel = usePostApiV1ParcelsByIdCloseMutation;
