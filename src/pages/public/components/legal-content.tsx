import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LegalContentProps {
  children: ReactNode;
  className?: string;
}

export function LegalContent({ children, className }: LegalContentProps) {
  return (
    <div
      className={cn(
        'text-sm leading-6 text-foreground',
        '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:first:mt-0',
        '[&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2',
        '[&_p]:mb-3 [&_p]:text-muted-foreground',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1 [&_ul]:text-muted-foreground',
        '[&_strong]:text-foreground [&_strong]:font-medium',
        '[&_hr]:my-6 [&_hr]:border-border',
        '[&_a]:text-primary hover:[&_a]:underline',
        className,
      )}
    >
      {children}
    </div>
  );
}
