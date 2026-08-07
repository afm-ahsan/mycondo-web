import { env } from '@/lib/env';
import { Container } from '@/components/common/container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex justify-center items-center py-5">
          <span className="text-muted-foreground font-normal text-sm">
            {currentYear} &copy; {env.VITE_MYCONDO_APP_NAME}
          </span>
        </div>
      </Container>
    </footer>
  );
}
