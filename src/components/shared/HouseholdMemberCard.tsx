import { Pencil, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateAge } from '@/lib/date/age';

export interface HouseholdMemberCardProps {
  relationshipLabel: string;
  fullName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
}

/** Household member summary card — relationship badge, name, gender/age line, Edit/Remove actions.
 * Shared between Flat Owner and Tenant Registration's Household steps; each feature maps its own API
 * DTO into these props rather than this component knowing about either shape. */
export function HouseholdMemberCard({
  relationshipLabel,
  fullName,
  gender,
  dateOfBirth,
  onEdit,
  onRemove,
  removeLabel = 'Remove',
  disabled,
}: HouseholdMemberCardProps) {
  const age = calculateAge(dateOfBirth);
  const summary = [gender, age !== null ? `Age ${age}` : null].filter(Boolean).join(' · ');

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">
            {relationshipLabel}
          </Badge>
          <span className="truncate font-medium">{fullName}</span>
        </div>
        {summary && <p className="text-muted-foreground text-xs">{summary}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        {onEdit && (
          <Button type="button" variant="ghost" size="icon" onClick={onEdit} disabled={disabled} aria-label={`Edit ${fullName}`}>
            <Pencil className="size-4" />
          </Button>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`${removeLabel} ${fullName}`}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
