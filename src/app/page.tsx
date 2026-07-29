import { PageBackground } from "@/components/layout/page-background";

export default function HomePage() {
  return (
    <PageBackground>
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <section aria-labelledby="page-title" className="space-y-4">
          <p className="font-system text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            System online
          </p>
          <h1
            className="font-display text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl"
            id="page-title"
          >
            RuleShift AI
          </h1>
          <p className="max-w-xl text-base leading-7 text-secondary-foreground">
            The strict, testable application foundation is ready. The adventure
            interface arrives in a later phase.
          </p>
        </section>
      </main>
    </PageBackground>
  );
}
