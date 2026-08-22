import { ShieldCheck, ShieldX, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { SecurityDirectoryEntryDto } from '@/api/generated/mycondoApi';
import { useAttachmentContentUrl } from '@/features/attachments/hooks/useAttachmentContentUrl';

const RESIDENT_TYPE_LABELS: Record<string, string> = {
  Owner: 'Owner',
  Tenant: 'Tenant',
};

/** One directory entry — the entire card is the click target that opens the detail modal. */
export function ResidentCard({ entry, onClick }: { entry: SecurityDirectoryEntryDto; onClick: () => void }) {
  const photoUrl = useAttachmentContentUrl(entry.primaryPhotoAttachmentId);
  const authorized = entry.accessStatus === 'Authorized';

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="hover:border-primary cursor-pointer transition-colors"
    >
      <CardContent className="flex items-center gap-3 py-4">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="size-11 shrink-0 rounded-full border object-cover" />
        ) : (
          <div className="bg-accent flex size-11 shrink-0 items-center justify-center rounded-full border">
            <User className="text-muted-foreground size-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{entry.primaryFullName}</p>
            <Badge variant="secondary" size="sm" appearance="light">
              {RESIDENT_TYPE_LABELS[entry.residentType] ?? entry.residentType}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {entry.buildingName} · {entry.flatNumber}
          </p>
        </div>
        <Badge variant={authorized ? 'success' : 'destructive'} appearance="light" className="shrink-0">
          {authorized ? <ShieldCheck className="size-3" /> : <ShieldX className="size-3" />}
          {entry.accessStatus}
        </Badge>
      </CardContent>
    </Card>
  );
}
