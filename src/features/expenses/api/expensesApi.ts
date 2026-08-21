import {
  useGetApiV1ExpensesQuery,
  useGetApiV1ExpensesByIdQuery,
  useGetApiV1ExpenseCategoriesQuery,
  useGetApiV1ExpenseCategoriesActiveQuery,
  usePostApiV1ExpenseCategoriesByIdActivateMutation,
  usePostApiV1ExpenseCategoriesByIdDeactivateMutation,
  usePostApiV1ExpenseCategoriesMutation,
  usePutApiV1ExpenseCategoriesByIdMutation,
  useGetApiV1ExpenseTypesActiveQuery,
  useGetApiV1ExpenseTypesQuery,
  usePostApiV1ExpenseTypesByIdActivateMutation,
  usePostApiV1ExpenseTypesByIdDeactivateMutation,
  usePostApiV1ExpenseTypesMutation,
  usePostApiV1ExpensesByIdVoidMutation,
  usePostApiV1ExpensesMutation,
  usePutApiV1ExpenseTypesByIdMutation,
  usePutApiV1ExpensesByIdMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see src/features/auth/api/authApi.ts
// for the same pattern.
export const useExpenseCategories = useGetApiV1ExpenseCategoriesQuery;
export const useActiveExpenseCategories = useGetApiV1ExpenseCategoriesActiveQuery;
export const useCreateExpenseCategory = usePostApiV1ExpenseCategoriesMutation;
export const useUpdateExpenseCategory = usePutApiV1ExpenseCategoriesByIdMutation;
export const useDeactivateExpenseCategory = usePostApiV1ExpenseCategoriesByIdDeactivateMutation;
export const useActivateExpenseCategory = usePostApiV1ExpenseCategoriesByIdActivateMutation;

export const useExpenseTypes = useGetApiV1ExpenseTypesQuery;
export const useActiveExpenseTypes = useGetApiV1ExpenseTypesActiveQuery;
export const useCreateExpenseType = usePostApiV1ExpenseTypesMutation;
export const useUpdateExpenseType = usePutApiV1ExpenseTypesByIdMutation;
export const useDeactivateExpenseType = usePostApiV1ExpenseTypesByIdDeactivateMutation;
export const useActivateExpenseType = usePostApiV1ExpenseTypesByIdActivateMutation;

export const useExpenses = useGetApiV1ExpensesQuery;
export const useExpense = useGetApiV1ExpensesByIdQuery;
export const useCreateExpense = usePostApiV1ExpensesMutation;
export const useUpdateExpense = usePutApiV1ExpensesByIdMutation;
export const useVoidExpense = usePostApiV1ExpensesByIdVoidMutation;
