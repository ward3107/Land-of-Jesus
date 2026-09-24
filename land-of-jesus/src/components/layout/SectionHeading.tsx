import { cn } from '@/lib/utils';

/**
 * Centered section title + optional subtitle, in the editorial serif display
 * style used across the site.
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
  align = 'center',
  tone = 'default',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-16 max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-start',
        className,
      )}
    >
      <h2
        className={cn(
          'font-serif text-4xl',
          tone === 'inverted' ? 'text-white' : 'text-stone-900',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-4 text-lg',
            tone === 'inverted' ? 'text-stone-300' : 'text-stone-600',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
