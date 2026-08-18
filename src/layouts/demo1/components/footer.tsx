import { Container } from '@/components/common/container';
import { LegalNavLinks } from '@/components/common/legal-nav-links';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container width="fluid">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-5">
          <span className="text-muted-foreground font-normal text-sm">
            {currentYear} &copy;{' '}
            <a
              href="http://www.ajwadtech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              AJWAD Technologies
            </a>
          </span>
          <LegalNavLinks />
        </div>
      </Container>
    </footer>
  );
}
