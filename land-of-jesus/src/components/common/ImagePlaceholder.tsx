import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATIOS = {
  '16/10': 'aspect-[16/10]',
  '4/3': 'aspect-[4/3]',
  '4/5': 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
} as const;

const TONES = {
  stone: 'from-stone-200 to-sand text-muted',
  primary: 'from-primary-100 to-primary-200 text-primary-700',
  olive: 'from-green-100 to-green-200 text-hills',
} as const;

export interface ImagePlaceholderProps {
  /** Real image URL. When absent, a heritage-toned placeholder is shown. */
  src?: string | null;
  /** Empty string = decorative (e.g. the name is already in adjacent text). */
  alt: string;
  ratio?: keyof typeof RATIOS;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
  className?: string;
  /** Larger icon for hero-scale placeholders. */
  iconClassName?: string;
  /** next/image `sizes` hint. */
  sizes?: string;
}

/**
 * Media frame with a graceful fallback. With `src` it renders next/image
 * (lazy by default); otherwise a photo-palette gradient with an icon that
 * never claims to depict a specific place.
 */
export function ImagePlaceholder({
  src,
  alt,
  ratio = '16/10',
  tone = 'stone',
  icon: Icon = MapPin,
  className,
  iconClassName,
  sizes = '(max-width: 768px) 100vw, 33vw',
}: ImagePlaceholderProps) {
  return (
    <div className={cn('relative overflow-hidden bg-stone-200', RATIOS[ratio], className)}>
      {src ? (
        <Image src={src} alt={alt} fill unoptimized className="object-cover" sizes={sizes} />
      ) : (
        <div
          {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
          className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', TONES[tone])}
        >
          <Icon className={cn('h-12 w-12', iconClassName)} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
