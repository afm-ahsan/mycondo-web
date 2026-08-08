import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useDeactivateRatePlan, useEndRatePlanEffectivePeriod } from '../api/ratePlansApi';
import type { RatePlanDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Inactive'> = {
  Active: { label: 'Active', variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
};

interface RatePlanManageDialogProps {
  ratePlan: RatePlanDto | null;
  onOpenChange: (open: boolean) => void;
}

// Immutable, same as ServiceChargeRule — only Deactivate / EndEffectivePeriod, never edit.
export function RatePlanManageDialog({ ratePlan, onOpenChange }: RatePlanManageDialogProps) {
  const [deactivate, { isLoading: isDeactivating }] = useDeactivateRatePlan();
  const [endEffectivePeriod, { isLoading: isEnding }] = useEndRatePlanEffectivePeriod();
  const [effectiveTo, setEffectiveTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    if (!ratePlan) return;
    setError(null);
    try {
      await deactivate({ id: ratePlan.ratePlanId }).unwrap();
      toast.success(`"${ratePlan.name}" deactivated.`);
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  async function handleEndEffectivePeriod() {
    if (!ratePlan || !effectiveTo) return;
    setError(null);
    try {
      await endEffectivePeriod({
        id: ratePlan.ratePlanId,
        endRatePlanPeriodRequest: { effectiveTo: new Date(effectiveTo).toISOString().slice(0, 10) },
      }).unwrap();
      toast.success(`Effective period ended for "${ratePlan.name}".`);
      setEffectiveTo('');
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={ratePlan !== null}
      onOpenChange={(open) => {
        if (!open) {
          setEffectiveTo('');
          setError(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-lg">
        {ratePlan && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {ratePlan.name}
                <StatusBadge status={ratePlan.isActive ? 'Active' : 'Inactive'} toneMap={statusToneMap} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
                  <AlertIcon>
                    <AlertCircle />
                  </AlertIcon>
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Structure</div>
                  <div>{ratePlan.structure}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Fixed service charge</div>
                  <MoneyDisplay amount={ratePlan.fixedServiceCharge} />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Tax %</div>
                  <div>{ratePlan.taxPercentage}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Effective</div>
                  <div>{ratePlan.effectiveFrom} – {ratePlan.effectiveTo ?? 'open'}</div>
                </div>
              </div>

              {ratePlan.structure === 'Metered' && ratePlan.slabs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">Slabs</div>
                  <ul className="text-sm space-y-1">
                    {ratePlan.slabs.map((slab) => (
                      <li key={slab.slabOrder} className="flex justify-between rounded-md border border-border px-2 py-1">
                        <span>
                          {slab.fromUnits} – {slab.toUnits ?? '∞'} units
                        </span>
                        <MoneyDisplay amount={slab.ratePerUnit} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ratePlan.isActive && (
                <>
                  <Separator />
                  <RequirePermission permission={PERMISSIONS.utility.ratePlanManage}>
                    <div className="space-y-3">
                      {!ratePlan.effectiveTo && (
                        <div className="space-y-1.5">
                          <Label htmlFor="rateplan-effective-to">End effective period</Label>
                          <div className="flex gap-2">
                            <Input
                              id="rateplan-effective-to"
                              type="date"
                              value={effectiveTo}
                              onChange={(e) => setEffectiveTo(e.target.value)}
                              className="flex-1"
                            />
                            <Button variant="outline" onClick={handleEndEffectivePeriod} disabled={isEnding || !effectiveTo}>
                              {isEnding ? 'Saving...' : 'Set End Date'}
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating}>
                          {isDeactivating ? 'Deactivating...' : 'Deactivate Rate Plan'}
                        </Button>
                      </div>
                    </div>
                  </RequirePermission>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
