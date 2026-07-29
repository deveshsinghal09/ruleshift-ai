export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="page-title" className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Project foundation
        </p>
        <h1
          className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl"
          id="page-title"
        >
          RuleShift AI
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-300">
          The strict, testable application foundation is ready. The adventure
          interface arrives in a later phase.
        </p>
      </section>
    </main>
  );
}
