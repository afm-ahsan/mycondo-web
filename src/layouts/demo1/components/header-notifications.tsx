import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, Bell, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFinancialSummaryReport } from '@/features/payments/api/reportsApi';
import { useSecuritySummaryReport } from '@/features/security/api/reportsApi';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useAppSelector } from '@/store/hooks';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * mycondo-api has no notifications/inbox endpoint or SignalR push channel, so there is no real
 * unread-badge/read-state inbox to build here — fabricating one would mean inventing persistence.
 * Instead this surfaces the same real, permission-gated aggregate counts the Dashboard's
 * Financial/Security summary cards already read (identical RTK Query args to
 * ExecutiveSummarySection/FinancialSummarySection/SecuritySummarySection, so this never issues an
 * extra request beyond what the Dashboard already triggers) as actionable alerts, each linking to the
 * list page that explains it. Widen this if/when mycondo-api exposes a real notifications feed.
 */
export function HeaderNotifications() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const canViewFinancial = hasPermission(user, PERMISSIONS.report.financialView);
  const canViewSecurity = hasPermission(user, PERMISSIONS.report.securityView);

  const financial = useFinancialSummaryReport(
    canViewFinancial ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken,
  );
  const security = useSecuritySummaryReport(canViewSecurity ? undefined : skipToken);

  if (!canViewFinancial && !canViewSecurity) {
    return null;
  }

  const overdueInvoiceCount = Number(financial.data?.overdueInvoiceCount ?? 0);
  const parcelsAwaitingCount = Number(security.data?.parcelsAwaitingCollectionCount ?? 0);
  const alertCount = overdueInvoiceCount + parcelsAwaitingCount;
  const isLoading = (canViewFinancial && financial.isFetching) || (canViewSecurity && security.isFetching);
  const hasError = (canViewFinancial && financial.isError) || (canViewSecurity && security.isError);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" mode="icon" aria-label="Notifications" className="relative">
          <Bell className="text-muted-foreground/70" />
          {alertCount > 0 && (
            <Badge
              variant="destructive"
              size="sm"
              shape="circle"
              className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px]"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" side="bottom" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasError ? (
          <div className="p-3 text-sm text-muted-foreground">Couldn&apos;t load notifications.</div>
        ) : isLoading && alertCount === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">Checking…</div>
        ) : alertCount === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">You&apos;re all caught up.</div>
        ) : (
          <>
            {canViewFinancial && overdueInvoiceCount > 0 && (
              <DropdownMenuItem
                onSelect={() => navigate('/billing/outstanding-invoices')}
                className="flex items-start gap-2"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>
                  {overdueInvoiceCount} overdue invoice{overdueInvoiceCount === 1 ? '' : 's'}
                </span>
              </DropdownMenuItem>
            )}
            {canViewSecurity && parcelsAwaitingCount > 0 && (
              <DropdownMenuItem
                onSelect={() => navigate('/security/parcels')}
                className="flex items-start gap-2"
              >
                <Package className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  {parcelsAwaitingCount} parcel{parcelsAwaitingCount === 1 ? '' : 's'} awaiting collection
                </span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
