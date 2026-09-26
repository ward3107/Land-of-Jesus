import { cn } from '@/lib/utils';

/**
 * A decorative section divider: a slender Latin cross haloed in soft light,
 * flanked by thin rules that fade outward. Denomination-neutral (an empty
 * cross, not a crucifix) so it reads as Christian across every tradition the
 * site serves. Purely ornamental — hidden from assistive tech, RTL-symmetric.
 *
 * `tone="dark"` recolours it for dark sections; the default suits linen/stone.
 */
export function SacredMark({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const rule = tone === 'dark' ? 'to-white/30' : 'to-primary-400/50';
  const cross = tone === 'dark' ? 'text-gold' : 'text-primary-500';

  return (
    <div aria-hidden="true" className={cn('flex items-center justify-center gap-4', className)}>
      <span className={cn('h-px w-12 bg-gradient-to-r from-transparent sm:w-24', rule)} />
      <svg viewBox="0 0 32 44" className={cn('h-9 w-auto', cross)} fill="none" role="presentation">
        <defs>
          <radialGradient id="sacred-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
            <stop offset="65%" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="15" r="16" fill="url(#sacred-glow)" />
        <rect x="14" y="2" width="4" height="40" rx="2" fill="currentColor" />
        <rect x="6" y="12" width="20" height="4" rx="2" fill="currentColor" />
      </svg>
      <span className={cn('h-px w-12 bg-gradient-to-l from-transparent sm:w-24', rule)} />
    </div>
  );
}
