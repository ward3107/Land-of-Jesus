import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export interface SiteStripItem {
  slug: string;
  name: string;
  city: string;
  image: string | null;
}

export interface SiteStripProps {
  title: string;
  hint: string;
  viewAll: { href: string; label: string };
  items: SiteStripItem[];
}

/**
 * Horizontally swipeable row of sacred sites (scroll-snap, hidden scrollbar,
 * logical padding so it mirrors in RTL). Keyboard users can focus the row and
 * scroll it with the arrow keys.
 */
export function SiteStrip({ title, hint, viewAll, items }: SiteStripProps) {
  return (
    <section className="bg-linen py-10 md:py-16">
      <Container className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="site-strip-title"
            className="font-serif text-[28px] font-semibold leading-tight tracking-tight text-night md:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted md:hidden">{hint}</p>
        </div>
        <Link
          href={viewAll.href}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full text-[15px] font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {viewAll.label}
          <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </Container>

      <div
        role="region"
        aria-labelledby="site-strip-title"
        tabIndex={0}
        className="scrollbar-none mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 sm:scroll-px-6 sm:px-6 md:gap-4"
      >
        {items.map((s) => (
          <Link
            key={s.slug}
            href={`/churches/${s.slug}`}
            className="relative w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-card bg-stone-200 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen md:w-[300px]"
          >
            <ImagePlaceholder src={s.image} alt="" ratio="4/5" sizes="(max-width: 768px) 78vw, 300px" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 via-night/40 to-transparent p-4 pt-16">
              <h3 className="text-lg font-semibold leading-snug text-white">{s.name}</h3>
              <p className="text-sm text-white/85">{s.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
