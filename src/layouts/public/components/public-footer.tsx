import { Container } from '@/components/common/container';
import { LegalNavLinks } from '@/components/common/legal-nav-links';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <Container>
        <div className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <a
            href="http://ajwadtech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &copy; {currentYear} AJWAD Technologies
          </a>
          <LegalNavLinks />
        </div>
      </Container>
    </footer>
  );
}
