export function ComingSoon({ title, phase, children }: { title: string; phase: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">{title}</h1>
      <p className="text-sm text-ink-500">{children}</p>
      <span className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        {phase}
      </span>
    </div>
  );
}
