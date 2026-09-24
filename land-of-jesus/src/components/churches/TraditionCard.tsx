import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

export interface TraditionCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile background (e.g. 'bg-primary-100'). */
  accentClass: string;
  iconClass: string;
}

/**
 * "Explore by tradition" row (Catholic / Orthodox / Armenian …), like an iOS
 * settings cell: icon tile, title + description, chevron.
 */
export function TraditionCard({ href, title, description, icon: Icon, accentClass, iconClass }: TraditionCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card border border-hairline/80 bg-surface p-4 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
    >
      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-control', accentClass)} aria-hidden="true">
        <Icon className={cn('h-6 w-6', iconClass)} />
      </span>
      <span className="min-w-0 flex-1">
        <h3 className="text-[17px] font-semibold text-night">{title}</h3>
        <p className="mt-0.5 text-[15px] text-muted">{description}</p>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}
