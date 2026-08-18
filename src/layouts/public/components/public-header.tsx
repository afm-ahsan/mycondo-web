import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Container } from '@/components/common/container';
import { LegalNavLinks } from '@/components/common/legal-nav-links';

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-background">
      <Container>
        <div className="flex flex-col gap-3 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <Link to="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/condobd-logo.png')}
              className="h-8 w-auto max-w-none"
              alt="CondoBD"
            />
          </Link>
          <nav aria-label="Public navigation">
            <LegalNavLinks className="justify-start sm:justify-end" />
          </nav>
        </div>
      </Container>
    </header>
  );
}
