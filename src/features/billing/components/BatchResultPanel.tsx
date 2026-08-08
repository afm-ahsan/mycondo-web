import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { GenerateInvoiceBatchResultDto } from '@/api/generated/mycondoApi';

interface BatchResultPanelProps {
  result: GenerateInvoiceBatchResultDto;
}

function OutcomeSection({
  title,
  count,
  items,
  variant,
}: {
  title: string;
  count: number;
  items: { flatId: string; reason: string }[];
  variant: 'warning' | 'destructive';
}) {
  const [expanded, setExpanded] = useState(false);
  if (count === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant={variant} appearance="light">
          {title}: {count}
        </Badge>
        <Button variant="dim" size="sm" className="h-auto p-0 underline" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide details' : 'Show details'}
        </Button>
      </div>
      {expanded && (
        <ul className="text-sm space-y-1 rounded-md border border-border p-2">
          {items.map((item, index) => (
            <li key={`${item.flatId}-${index}`} className="flex justify-between gap-4">
              <span className="font-mono text-xs text-muted-foreground">{item.flatId}</span>
              <span>{item.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Structured, non-collapsed rendering of a batch-generation outcome — Generated / Already Existing /
 * Skipped / Failed are always shown as separate counts (never merged into one "Success" toast), with
 * item-level flat/reason detail available for Skipped and Failed. All numbers/reasons are exactly
 * what the API returned.
 */
export function BatchResultPanel({ result }: BatchResultPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Batch Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-md border border-border p-3">
            <div className="text-2xl font-semibold tabular-nums">{result.generatedCount}</div>
            <div className="text-muted-foreground text-xs">Generated</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-2xl font-semibold tabular-nums">{result.alreadyExistingCount}</div>
            <div className="text-muted-foreground text-xs">Already existing</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-2xl font-semibold tabular-nums">{result.skippedCount}</div>
            <div className="text-muted-foreground text-xs">Skipped</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-2xl font-semibold tabular-nums">{result.failedCount}</div>
            <div className="text-muted-foreground text-xs">Failed</div>
          </div>
        </div>

        <OutcomeSection title="Skipped" count={Number(result.skippedCount)} items={result.skippedItems} variant="warning" />
        <OutcomeSection title="Failed" count={Number(result.failedCount)} items={result.failedItems} variant="destructive" />

        {result.generatedInvoiceIds.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-sm font-medium">Generated invoices</div>
            <div className="flex flex-wrap gap-2">
              {result.generatedInvoiceIds.map((invoiceId) => (
                <Button key={invoiceId} variant="outline" size="sm" asChild>
                  <Link to={`/billing/invoices/${invoiceId}`}>View</Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
