import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/common/container';

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <Container width="fluid" className={cn('max-w-[820px] mx-auto py-10 md:py-12', className)}>
      {children}
    </Container>
  );
}
