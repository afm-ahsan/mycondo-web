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
import { useCollectParcel } from '../api/parcelsApi';

interface CollectParcelDialogProps {
  parcelId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CollectParcelDialog({ parcelId, onOpenChange }: CollectParcelDialogProps) {
  const [collectParcel, { isLoading }] = useCollectParcel();
  const [collectorName, setCollectorName] = useState('');
  const [acknowledgement, setAcknowledgement] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCollectorName('');
    setAcknowledgement('');
    setError(null);
  }

  async function handleSubmit() {
    if (!parcelId) return;
    setError(null);
    try {
      await collectParcel({
        id: parcelId,
        collectParcelRequest: { collectorName, acknowledgement: acknowledgement || null },
      }).unwrap();
      toast.success('Parcel handed over.');
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={parcelId !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Collection</DialogTitle>
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
            <Label htmlFor="collector-name">Collected by</Label>
            <Input
              id="collector-name"
              placeholder="Name of the person collecting"
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="collector-ack">Acknowledgement (optional)</Label>
            <Input
              id="collector-ack"
              placeholder="e.g. ID checked, relation to resident"
              value={acknowledgement}
              onChange={(e) => setAcknowledgement(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || collectorName.trim().length === 0}>
            {isLoading ? 'Saving...' : 'Confirm Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
