import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFlatsMissingArea } from '../api/serviceChargeRulesApi';

interface FlatsMissingAreaNoticeProps {
  buildingId: string;
}

/**
 * Surfaces `GET /service-charge-rules/flats-missing-area` — flats that will be silently skipped by
 * any PerSquareFoot rule (no `AreaSqFt` recorded) — both on the Rules directory (so it's visible
 * while reviewing PerSquareFoot rules) and on Batch Billing's pre-generation context, per the UX-3
 * spec's "surface missing-flat-area results clearly" requirement. Read-only; never blocks generation
 * itself — the backend's own batch result already reports these as `skippedItems`.
 */
export function FlatsMissingAreaNotice({ buildingId }: FlatsMissingAreaNoticeProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, isFetching } = useFlatsMissingArea({ buildingId, page: 1, pageSize: 100 });

  if (isFetching || !data || Number(data.total) === 0) {
    return null;
  }

  return (
    <Alert variant="warning" appearance="light">
      <AlertIcon>
        <AlertTriangle />
      </AlertIcon>
      <div className="flex-1">
        <AlertTitle>
          {data.total} flat{Number(data.total) === 1 ? '' : 's'} in this building have no recorded area — any
          PerSquareFoot rule will skip them.
        </AlertTitle>
        <Button variant="dim" size="sm" className="h-auto p-0 mt-1 underline" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide flat list' : 'Show flat list'}
        </Button>
        {expanded && (
          <ul className="mt-2 text-sm space-y-0.5">
            {data.items.map((flat) => (
              <li key={flat.flatId}>Flat {flat.flatNumber}</li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}
