import { Link } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useGates } from '../api/gatesApi';

/**
 * Shown above a check-in/checkout form's gate picker when the building has no usable gate — the
 * `GateSelect` dropdown alone would just read as a disabled control with no explanation. Reuses the
 * same active-gates query `GateSelect` makes for this building/capability, so RTK Query serves this
 * from cache rather than firing a second request.
 */
export function EntryGateEmptyNotice({
  buildingId,
  capability,
}: {
  buildingId: string | undefined;
  capability: 'entry' | 'exit';
}) {
  const { data, isLoading, isError } = useGates(
    buildingId ? { buildingId, activeOnly: true } : skipToken,
  );

  if (!buildingId || isLoading || isError) {
    return null;
  }

  const usable = (data ?? []).filter((gate) =>
    capability === 'entry' ? gate.isEntryAllowed : gate.isExitAllowed,
  );
  if (usable.length > 0) {
    return null;
  }

  return (
    <Alert variant="warning" appearance="light">
      <AlertIcon>
        <AlertTriangle />
      </AlertIcon>
      <AlertTitle className="flex flex-col items-start gap-2">
        <span>
          No active entry gates are configured. Ask an administrator to configure an entry gate before{' '}
          {capability === 'entry' ? 'check-in' : 'checkout'}.
        </span>
        <RequirePermission permission={PERMISSIONS.gate.manage}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/security/entry-gates">Configure Entry Gates</Link>
          </Button>
        </RequirePermission>
      </AlertTitle>
    </Alert>
  );
}
