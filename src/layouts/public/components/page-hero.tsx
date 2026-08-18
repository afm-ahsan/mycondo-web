import { Container } from '@/components/common/container';

interface PageHeroProps {
  title: string;
  description?: string;
}

export function PageHero({ title, description }: PageHeroProps) {
  return (
    <section className="border-b border-border bg-muted/30">
      <Container>
        <div className="py-10 md:py-12">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
