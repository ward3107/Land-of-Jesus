export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

/** A single overview metric tile. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}
