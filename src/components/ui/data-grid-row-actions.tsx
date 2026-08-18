import { type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { hasPermission, hasPermissionForBuilding } from '@/lib/auth/permissions';
import { useAppSelector } from '@/store/hooks';

export interface RowAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Omit for an action available to anyone who can see the row. */
  permission?: string;
  /** Pass alongside `permission` to also allow a building-scoped grant for this building. */
  buildingId?: string;
  variant?: 'destructive';
  disabled?: boolean;
  /** Drop the action from the menu regardless of permission (e.g. status doesn't allow it). */
  hidden?: boolean;
}

interface RowActionsMenuProps {
  actions: RowAction[];
  /** Falls back to a generic label; pass a row-identifying label for a11y (e.g. `Actions for ${name}`). */
  ariaLabel?: string;
}

/**
 * The standard `Action` column control for `DataGrid` tables with two or more possible row
 * actions: a compact icon-only kebab trigger that opens a `DropdownMenu`. Actions are filtered by
 * permission before rendering (same authorization helpers as `RequirePermission`), so the trigger
 * itself is omitted entirely when the current user can't perform any of a row's actions.
 */
export function RowActionsMenu({ actions, ariaLabel = 'Row actions' }: RowActionsMenuProps) {
  const user = useAppSelector((s) => s.auth.user);

  const visibleActions = actions.filter((action) => {
    if (action.hidden) return false;
    if (!action.permission) return true;
    return action.buildingId
      ? hasPermissionForBuilding(user, action.permission, action.buildingId)
      : hasPermission(user, action.permission);
  });

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" mode="icon" size="sm" aria-label={ariaLabel}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibleActions.map((action) => (
          <DropdownMenuItem key={action.key} variant={action.variant} disabled={action.disabled} onClick={action.onClick}>
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
