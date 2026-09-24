import { cn } from '@/lib/utils';

/**
 * Accessible progress indicator (role=progressbar). `value` is 0–100. Cedar
 * fill on a limestone-gold track (3.37:1 against solid gold).
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
          {label ? <span className="text-muted">{label}</span> : <span />}
          {valueLabel ? <span className="font-semibold text-night">{valueLabel}</span> : null}
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-gold/60"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full bg-primary-600 transition-[inline-size] duration-700 ease-ios')}
          style={{ inlineSize: `${pct}%` }}
        />
      </div>
    </div>
  );
}
