import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { buttonVariants } from '@/components/ui/button';

export interface HeroCta {
  href: string;
  label: string;
}

export interface HeroProps {
  image: string;
  headline: string;
  subheadline: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}

/**
 * "Living photo" hero: a full-screen Holy Land photo with a slow Ken Burns
 * zoom. Where scroll-driven animations exist, the photo fades and scales and
 * the text rises as you scroll away (see .hero-media / .hero-content in
 * globals.css). Pure CSS, no client JS; static under reduced motion.
 */
export function Hero({ image, headline, subheadline, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="hero-min-h relative isolate flex items-end overflow-hidden bg-night text-white md:items-center"
    >
      <div className="hero-media absolute inset-0 -z-10" aria-hidden="true">
        <div className="relative h-full w-full animate-ken-burns">
          <Image src={image} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/50 to-night/10"
        aria-hidden="true"
      />

      <Container className="hero-content hero-pb pt-24 md:py-28">
        <h1
          id="hero-title"
          className="max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          {headline}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">{subheadline}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={primaryCta.href} className={buttonVariants({ size: 'lg' })}>
            {primaryCta.label}
            <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
          <Link href={secondaryCta.href} className={buttonVariants({ variant: 'glass', size: 'lg' })}>
            <MapPin className="h-5 w-5" aria-hidden="true" />
            {secondaryCta.label}
          </Link>
        </div>
      </Container>
    </section>
  );
}
