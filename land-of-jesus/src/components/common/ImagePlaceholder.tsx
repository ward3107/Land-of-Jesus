import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATIOS = {
  '16/10': 'aspect-[16/10]',
  '4/3': 'aspect-[4/3]',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
} as const;

const TONES = {
  stone: 'from-stone-300 to-stone-400 text-stone-500',
  primary: 'from-primary-100 to-primary-200 text-primary-700',
  olive: 'from-olive-100 to-olive-200 text-olive-700',
} as const;

export interface ImagePlaceholderProps {
  /** Real image URL. When absent, a heritage-toned placeholder is shown. */
  src?: string | null;
  alt: string;
  ratio?: keyof typeof RATIOS;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
  className?: string;
  /** Larger icon for hero-scale placeholders. */
  iconClassName?: string;
}

/**
 * Media frame with a graceful fallback. When `src` is provided it renders an
 * optimized next/image; otherwise a heritage-toned gradient with an icon that
 * never claims to depict a specific place. Wiring real photos later = pass `src`.
 */
export function ImagePlaceholder({
  src,
  alt,
  ratio = '16/10',
  tone = 'stone',
  icon: Icon = MapPin,
  className,
  iconClassName,
}: ImagePlaceholderProps) {
  return (
    <div className={cn('relative overflow-hidden bg-stone-200', RATIOS[ratio], className)}>
      {src ? (
        <Image src={src} alt={alt} fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', TONES[tone])}
        >
          <Icon className={cn('h-12 w-12', iconClassName)} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
