import { cn } from '@/lib/utils';

/**
 * A titled content section used on the church/project profile pages: an
 * editorial serif heading followed by its content.
 */
export function ProfileSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className={cn('mb-4 font-serif text-2xl font-semibold text-night')}>{title}</h2>
      {children}
    </section>
  );
}
