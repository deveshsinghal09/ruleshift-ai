export function SkipLink() {
  return (
    <a
      className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-md border border-exploration/70 bg-elevated px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-elevated)] transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
      href="#main-content"
    >
      Skip to adventure content
    </a>
  );
}
