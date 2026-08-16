import {
  mycondoApi,
  useDeleteApiV1AttachmentsByAttachmentIdMutation,
  useGetApiV1AttachmentsQuery,
} from '@/api/generated/mycondoApi';
import type { AttachmentDto } from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005, same pattern as authApi.ts).
export const useAttachmentsForOwner = useGetApiV1AttachmentsQuery;
export const useDeleteAttachment = useDeleteApiV1AttachmentsByAttachmentIdMutation;

interface UploadAttachmentArgs {
  file: File;
  ownerType: string;
  ownerId: string;
}

/**
 * Hand-authored: the generated `postApiV1Attachments` operation types its body as a plain
 * `{ file, ownerType, ownerId }` object, which fetchBaseQuery would JSON-serialize — never actually
 * sending multipart/form-data (same issue/fix as `authApi.ts`'s `uploadMyAvatar`). Injected into
 * `mycondoApi` itself so `invalidatesTags: ['Attachments']` type-checks and actually triggers the
 * owning list query's refetch. Never edit the generated file to fix this — regenerating reverts it.
 */
const attachmentsApi = mycondoApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAttachment: build.mutation<AttachmentDto, UploadAttachmentArgs>({
      query: ({ file, ownerType, ownerId }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ownerType', ownerType);
        formData.append('ownerId', ownerId);
        return { url: '/api/v1/attachments', method: 'POST', body: formData };
      },
      invalidatesTags: ['Attachments'],
    }),
    // Attachments are served from an authenticated endpoint, never a public/static path — an
    // <img src> can't attach a bearer token, so this fetches the bytes as a blob and the caller turns
    // that into an object URL (see useAttachmentContentUrl) instead of pointing an <img> straight at
    // the API URL, the same pattern as useAvatarUrl/getMyAvatarBlob.
    getAttachmentContentBlob: build.query<Blob, string>({
      query: (attachmentId) => ({
        url: `/api/v1/attachments/${attachmentId}/content`,
        responseHandler: (response: Response) => response.blob(),
      }),
      providesTags: ['Attachments'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadAttachmentMutation,
  useGetAttachmentContentBlobQuery,
  useLazyGetAttachmentContentBlobQuery,
} = attachmentsApi;
