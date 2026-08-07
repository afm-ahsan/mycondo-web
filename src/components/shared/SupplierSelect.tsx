import { useGetApiV1GasCylinderSuppliersQuery } from '@/api/generated/mycondoApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SupplierSelectProps {
  value: string | undefined;
  onValueChange: (supplierId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Server-driven gas cylinder supplier picker (`GET /api/v1/gas-cylinder-suppliers`), mirrors
 * `FacilitySelect`. Only active suppliers are offered. */
export function SupplierSelect({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a supplier',
}: SupplierSelectProps) {
  const { data, isLoading, isError } = useGetApiV1GasCylinderSuppliersQuery({ page: 1, pageSize: 100 });

  const activeSuppliers = data?.items.filter((supplier) => supplier.isActive) ?? [];

  const placeholderText = isLoading
    ? 'Loading suppliers…'
    : isError
      ? 'Failed to load suppliers'
      : placeholder;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading || isError}>
      <SelectTrigger className="w-full" aria-invalid={isError}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent>
        {activeSuppliers.map((supplier) => (
          <SelectItem key={supplier.gasCylinderSupplierId} value={supplier.gasCylinderSupplierId}>
            {supplier.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
