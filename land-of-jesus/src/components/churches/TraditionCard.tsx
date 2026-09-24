import type { LucideIcon } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TraditionCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile gradient + icon color. */
  accentClass: string;
  iconClass: string;
}

/**
 * "Explore by tradition" card (Catholic / Orthodox / Armenian …).
 */
export function TraditionCard({
  href,
  title,
  description,
  icon: Icon,
  accentClass,
  iconClass,
}: TraditionCardProps) {
  return (
    <Card className="p-6 transition-shadow hover:shadow-lg">
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-stone-200">
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', accentClass)}>
            <Icon className={cn('h-16 w-16', iconClass)} aria-hidden="true" />
          </div>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-stone-900">{title}</h3>
        <p className="text-stone-600">{description}</p>
      </Link>
    </Card>
  );
}
