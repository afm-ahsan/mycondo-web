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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMarkParcelDamaged } from '../api/parcelsApi';

interface MarkDamagedDialogProps {
  parcelId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function MarkDamagedDialog({ parcelId, onOpenChange }: MarkDamagedDialogProps) {
  const [markDamaged, { isLoading }] = useMarkParcelDamaged();
  const [damageNote, setDamageNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!parcelId) return;
    setError(null);
    try {
      await markDamaged({ id: parcelId, markParcelDamagedRequest: { damageNote } }).unwrap();
      toast.success('Parcel marked as damaged.');
      setDamageNote('');
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={parcelId !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDamageNote('');
          setError(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Parcel Damaged</DialogTitle>
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
            <Label htmlFor="damage-note">Damage note</Label>
            <Textarea
              id="damage-note"
              placeholder="Describe the visible damage…"
              value={damageNote}
              onChange={(e) => setDamageNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || damageNote.trim().length === 0}>
            {isLoading ? 'Saving...' : 'Mark Damaged'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
