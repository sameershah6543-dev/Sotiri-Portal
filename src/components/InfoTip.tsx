// Pure-CSS hover/focus tooltip — no client-side JS needed, so this can be
// dropped into server components (table headers, gauge tiles) freely.
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle" tabIndex={0}>
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        className="text-muted group-hover:text-accent group-focus:text-accent transition-colors cursor-help"
        aria-hidden
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 hidden w-56 -translate-x-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-normal normal-case text-ink shadow-lg group-hover:block group-focus:block"
      >
        {text}
      </span>
    </span>
  );
}
