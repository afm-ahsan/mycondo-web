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
import { useDeactivateServiceChargeRule, useEndServiceChargeRuleEffectivePeriod } from '../api/serviceChargeRulesApi';
import { ruleDisplayStatus } from '../lib/ruleStatus';
import type { ServiceChargeRuleDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Ended' | 'Inactive'> = {
  Active: { label: 'Active', variant: 'success' },
  Ended: { label: 'Ended', variant: 'warning' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
};

interface ServiceChargeRuleManageDialogProps {
  rule: ServiceChargeRuleDto | null;
  onOpenChange: (open: boolean) => void;
}

// Rules are immutable — this dialog only ever offers Deactivate / End Effective Period, never edit.
// A rule change means ending/deactivating this one and creating another (see the Directory page's
// "New Rule" action).
export function ServiceChargeRuleManageDialog({ rule, onOpenChange }: ServiceChargeRuleManageDialogProps) {
  const [deactivate, { isLoading: isDeactivating }] = useDeactivateServiceChargeRule();
  const [endEffectivePeriod, { isLoading: isEnding }] = useEndServiceChargeRuleEffectivePeriod();
  const [effectiveTo, setEffectiveTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    if (!rule) return;
    setError(null);
    try {
      await deactivate({ id: rule.serviceChargeRuleId }).unwrap();
      toast.success(`"${rule.name}" deactivated.`);
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  async function handleEndEffectivePeriod() {
    if (!rule || !effectiveTo) return;
    setError(null);
    try {
      await endEffectivePeriod({
        id: rule.serviceChargeRuleId,
        endServiceChargeRulePeriodRequest: { effectiveTo: new Date(effectiveTo).toISOString().slice(0, 10) },
      }).unwrap();
      toast.success(`Effective period ended for "${rule.name}".`);
      setEffectiveTo('');
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={rule !== null}
      onOpenChange={(open) => {
        if (!open) {
          setEffectiveTo('');
          setError(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-lg">
        {rule && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {rule.name}
                <StatusBadge status={ruleDisplayStatus(rule)} toneMap={statusToneMap} />
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
                  <div className="text-muted-foreground text-xs">Category</div>
                  <div>{rule.category}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Calculation method</div>
                  <div>{rule.calculationMethod}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Rate</div>
                  <MoneyDisplay amount={rule.rate} />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Unit type filter</div>
                  <div>{rule.unitTypeFilter ?? 'All types'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Effective from</div>
                  <div>{rule.effectiveFrom}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Effective to</div>
                  <div>{rule.effectiveTo ?? 'Open-ended'}</div>
                </div>
              </div>

              {rule.isActive && (
                <>
                  <Separator />
                  <RequirePermission permission={PERMISSIONS.billing.ruleManage}>
                    <div className="space-y-3">
                      {!rule.effectiveTo && (
                        <div className="space-y-1.5">
                          <Label htmlFor="rule-effective-to">End effective period</Label>
                          <div className="flex gap-2">
                            <Input
                              id="rule-effective-to"
                              type="date"
                              value={effectiveTo}
                              onChange={(e) => setEffectiveTo(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleEndEffectivePeriod}
                              disabled={isEnding || !effectiveTo}
                            >
                              {isEnding ? 'Saving...' : 'Set End Date'}
                            </Button>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            One-time only — a rule&rsquo;s effective-to date can&rsquo;t be changed once set.
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating}>
                          {isDeactivating ? 'Deactivating...' : 'Deactivate Rule'}
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
