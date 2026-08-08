import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInstallMeter } from '../api/metersApi';
import type { UtilityType } from '../lib/constants';

interface InstallMeterDialogProps {
  open: boolean;
  buildingId: string;
  utilityType: UtilityType;
  onOpenChange: (open: boolean) => void;
}

export function InstallMeterDialog({ open, buildingId, utilityType, onOpenChange }: InstallMeterDialogProps) {
  const [installMeter, { isLoading }] = useInstallMeter();
  const [meterNumber, setMeterNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setMeterNumber('');
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    setError(null);
    try {
      const meter = await installMeter({
        installMeterCommand: { buildingId, utilityType, meterNumber },
      }).unwrap();
      toast.success(`Meter "${meter.meterNumber}" installed.`);
      handleOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Install {utilityType} Meter</DialogTitle>
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
          <div className="space-y-1.5">
            <Label htmlFor="meter-number">Meter number</Label>
            <Input id="meter-number" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || meterNumber.trim().length === 0}>
            {isLoading ? 'Installing...' : 'Install Meter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
