import { useGetApiV1SecurityDirectoryByIdQuery, useGetApiV1SecurityDirectoryQuery } from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005).
export const useSecurityDirectory = useGetApiV1SecurityDirectoryQuery;
export const useSecurityDirectoryDetail = useGetApiV1SecurityDirectoryByIdQuery;
