import { cn } from '@/lib/utils';

/**
 * iOS large-title section heading (serif, start-aligned by default) with an
 * optional subtitle.
 */
export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'center' | 'start';
  tone?: 'default' | 'inverted';
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  align = 'start',
  tone = 'default',
  className,
}: SectionHeadingProps) {
  const inverted = tone === 'inverted';
  return (
    <div
      className={cn(
        'mb-8 max-w-2xl md:mb-12',
        align === 'center' ? 'mx-auto text-center' : 'text-start',
        className,
      )}
    >
      <h2
        className={cn(
          'font-serif text-[34px] font-semibold leading-[1.1] tracking-tight md:text-5xl',
          inverted ? 'text-white' : 'text-night',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={cn('mt-3 text-base md:text-lg', inverted ? 'text-white/75' : 'text-muted')}>{subtitle}</p>
      ) : null}
    </div>
  );
}
