import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  fromLabel?: string;
  toLabel?: string;
}

/**
 * The From/To date-input pair used by every report filter bar (see
 * FinancialSummaryReportPage/ReceivablesAgeingReportPage for the original inline markup this
 * matches exactly) — extracted because Template 5 adds ~20 more report pages that all need the
 * same pair. Renders as a fragment so it drops into the same `flex flex-wrap gap-4` filter row the
 * existing report pages already use.
 */
export function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  fromLabel = 'From',
  toLabel = 'To',
}: DateRangeFilterProps) {
  return (
    <>
      <div className="space-y-1">
        <Label>{fromLabel}</Label>
        <Input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>{toLabel}</Label>
        <Input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} />
      </div>
    </>
  );
}
