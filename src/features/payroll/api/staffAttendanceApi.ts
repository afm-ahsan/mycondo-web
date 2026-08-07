import {
  useGetApiV1AttendanceRecordsQuery,
  useGetApiV1StaffMembersByIdAttendanceQuery,
  useGetApiV1StaffMembersQuery,
  usePostApiV1AttendanceRecordsByIdApproveCorrectionMutation,
  usePostApiV1AttendanceRecordsByIdClockOutMutation,
  usePostApiV1AttendanceRecordsByIdRequestCorrectionMutation,
  usePostApiV1StaffMembersByIdClockInMutation,
  usePostApiV1StaffMembersMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005), mirroring domesticWorkersApi.ts's pattern.
export const useRegisterStaffMember = usePostApiV1StaffMembersMutation;
export const useStaffMembers = useGetApiV1StaffMembersQuery;
export const useClockIn = usePostApiV1StaffMembersByIdClockInMutation;
export const useStaffMemberAttendance = useGetApiV1StaffMembersByIdAttendanceQuery;
export const useAttendanceRegister = useGetApiV1AttendanceRecordsQuery;
export const useClockOut = usePostApiV1AttendanceRecordsByIdClockOutMutation;
export const useRequestCorrection = usePostApiV1AttendanceRecordsByIdRequestCorrectionMutation;
export const useApproveCorrection = usePostApiV1AttendanceRecordsByIdApproveCorrectionMutation;
