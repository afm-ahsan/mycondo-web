import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LEGAL_LINKS } from '@/components/common/legal-links';

interface LegalNavLinksProps {
  className?: string;
  linkClassName?: string;
}

/**
 * Shared About/Terms/Privacy/Contact link list. Every one of these pages is a standalone public
 * page, so wherever this list is rendered (login footer, authenticated app footer, public site
 * header/footer) the links open in a new tab rather than navigating the current session away.
 */
export function LegalNavLinks({ className, linkClassName }: LegalNavLinksProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-6 gap-y-2', className)}>
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-sm font-normal text-muted-foreground hover:text-primary transition-colors',
            linkClassName,
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
