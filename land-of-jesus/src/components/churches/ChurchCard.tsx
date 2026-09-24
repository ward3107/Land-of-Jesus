import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export interface ChurchCardProps {
  slug: string;
  name: string;
  location: string;
  tradition?: string;
  imageUrl?: string | null;
  /** Extra status pills (e.g. "Open to visitors"), shown after the tradition. */
  children?: ReactNode;
}

/**
 * iOS-style church card: 4:3 photo, name, place, and pills. The whole card is
 * one link with press feedback. The photo is decorative (the name is the text).
 */
export function ChurchCard({ slug, name, location, tradition, imageUrl, children }: ChurchCardProps) {
  return (
    <Link
      href={`/churches/${slug}`}
      className="block overflow-hidden rounded-card border border-hairline/80 bg-surface transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
    >
      <ImagePlaceholder src={imageUrl} alt="" ratio="4/3" />
      <div className="p-4">
        <h3 className="text-[17px] font-semibold leading-snug text-night">{name}</h3>
        <p className="mt-0.5 text-[15px] text-muted">{location}</p>
        {tradition || children ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tradition ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                {tradition}
              </span>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
