import { cn } from '@/lib/utils';

/**
 * Accessible progress indicator (role=progressbar). `value` is 0–100.
 */
export interface ProgressBarProps {
  value: number;
  label?: string;
  valueLabel?: string;
  className?: string;
}

export function ProgressBar({ value, label, valueLabel, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-2 flex justify-between text-sm">
          {label ? <span className="text-stone-600">{label}</span> : <span />}
          {valueLabel ? <span className="font-medium text-stone-900">{valueLabel}</span> : null}
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full bg-primary-600')}
          style={{ inlineSize: `${pct}%` }}
        />
      </div>
    </div>
  );
}
