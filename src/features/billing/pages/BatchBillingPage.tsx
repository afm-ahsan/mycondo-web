import { useState } from 'react';
import { Play } from 'lucide-react';
import { useGetApiV1PropertiesBuildingsQuery } from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { BatchResultPanel } from '../components/BatchResultPanel';
import { FlatsMissingAreaNotice } from '../components/FlatsMissingAreaNotice';
import { GenerateBatchDialog } from '../components/GenerateBatchDialog';
import type { GenerateInvoiceBatchResultDto } from '@/api/generated/mycondoApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function lastDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function BatchBillingPage() {
  const [buildingId, setBuildingId] = useState('');
  const [periodStart, setPeriodStart] = useState(firstDayOfMonth());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonth());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<GenerateInvoiceBatchResultDto | null>(null);

  // Same buildings list BuildingSelect itself queries — resolves a friendly name for the
  // confirmation dialog's "Building: X" line rather than showing a raw id.
  const { data: buildings } = useGetApiV1PropertiesBuildingsQuery({ page: 1, pageSize: 100 });
  const selectedBuilding = buildings?.items.find((b) => b.buildingId === buildingId);
  const buildingLabel = selectedBuilding ? `${selectedBuilding.name} (${selectedBuilding.code})` : buildingId;

  return (
    <>
      <PageHeader
        title="Generate Billing Run"
        crumbs={[{ label: 'Finance' }, { label: 'Service Charges' }, { label: 'Generate Billing Run' }]}
      />

      <div className="space-y-4">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Billing Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Building</Label>
              <BuildingSelect
                value={buildingId}
                onValueChange={(id) => {
                  setBuildingId(id);
                  setResult(null);
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="period-start">Period start</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period-end">Period end</Label>
                <Input id="period-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>

            {buildingId && <FlatsMissingAreaNotice buildingId={buildingId} />}

            <RequirePermission permission={PERMISSIONS.billing.invoiceGenerate}>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!buildingId || !periodStart || !periodEnd}
              >
                <Play /> Generate Invoices
              </Button>
            </RequirePermission>
          </CardContent>
        </Card>

        {result && <BatchResultPanel result={result} />}
      </div>

      <GenerateBatchDialog
        open={confirmOpen}
        buildingLabel={buildingLabel}
        buildingId={buildingId}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onOpenChange={setConfirmOpen}
        onResult={setResult}
      />
    </>
  );
}
