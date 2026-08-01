import { usePostApiV1TenantsMutation } from '@/api/generated/mycondoApi';

// Friendlier re-export of the OpenAPI-generated hook (ADR-005).
export const useCreateTenant = usePostApiV1TenantsMutation;
