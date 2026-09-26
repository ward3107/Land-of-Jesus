import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, BookOpen, Calendar, Heart, Users } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { cn, formatCurrency } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SacredMark } from '@/components/ui/SacredMark';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { Hero } from '@/components/home/Hero';
import { SiteStrip } from '@/components/home/SiteStrip';
import { TraditionCard } from '@/components/churches/TraditionCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { VISIT_IMAGE } from '@/lib/demo/data';
import { getChurches } from '@/lib/data/churches';
import { getProjects } from '@/lib/data/projects';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');
  const tc = await getTranslations('Explore');

  // Live Supabase content (falls back to bundled demo data on error/empty).
  const [churches, projects] = await Promise.all([getChurches(locale), getProjects(locale)]);
  const sites = churches.map((c) => ({ slug: c.slug, name: c.name, city: c.location.city, image: c.image }));

  // The hero "journey": a fixed narrative over the three sacred cities.
  const journey = [
    { image: '/images/churches/annunciation.jpg', city: tc('cityNazareth'), line: t('journeyLine1') },
    { image: '/images/churches/nativity.jpg', city: tc('cityBethlehem'), line: t('journeyLine2') },
    { image: '/images/churches/holy-sepulchre.jpg', city: tc('cityJerusalem'), line: t('journeyLine3') },
  ];

  const traditions = [
    { key: 'catholic', href: '/explore?tradition=catholic', title: t('traditionCatholicTitle'), description: t('traditionCatholicDesc'), accentClass: 'bg-primary-100', iconClass: 'text-primary-700' },
    { key: 'orthodox', href: '/explore?tradition=orthodox', title: t('traditionOrthodoxTitle'), description: t('traditionOrthodoxDesc'), accentClass: 'bg-sky/35', iconClass: 'text-sea' },
    { key: 'armenian', href: '/explore?tradition=armenian', title: t('traditionArmenianTitle'), description: t('traditionArmenianDesc'), accentClass: 'bg-green-100', iconClass: 'text-hills' },
  ];

  const stories = [
    { title: t('story1Title'), excerpt: t('story1Excerpt'), icon: BookOpen },
    { title: t('story2Title'), excerpt: t('story2Excerpt'), icon: Users },
  ];

  const visitItems = [t('visitItem1'), t('visitItem2'), t('visitItem3'), t('visitItem4')];

  return (
    <div className="flex flex-col">
      <Hero
        chapters={journey}
        title={t('heroHeadline')}
        scrollHint={t('journeyScrollHint')}
        progressLabel={t('journeyProgressLabel')}
        primaryCta={{ href: '/explore', label: t('ctaExplore') }}
        secondaryCta={{ href: '/explore?view=map', label: t('ctaOpenMap') }}
      />

      <SiteStrip
        title={t('sectionFeaturedChurches')}
        hint={t('swipeHint')}
        viewAll={{ href: '/explore', label: t('viewAllChurches') }}
        items={sites}
      />

      {/* Explore by tradition */}
      <Section tone="stone" className="pt-4 md:pt-8">
        <SacredMark className="mb-8 md:mb-10" />
        <Reveal>
          <SectionHeading title={t('sectionExploreTitle')} subtitle={t('exploreSubtitle')} />
        </Reveal>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {traditions.map((tr, i) => (
            <Reveal key={tr.key} delay={i * 60}>
              <TraditionCard
                href={tr.href}
                title={tr.title}
                description={tr.description}
                icon={BookOpen}
                accentClass={tr.accentClass}
                iconClass={tr.iconClass}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Stories */}
      <Section tone="white">
        <Reveal>
          <SectionHeading title={t('sectionStories')} subtitle={t('storiesSubtitle')} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <Card className="h-full p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-stone-100" aria-hidden="true">
                    <s.icon className="h-6 w-6 text-stone-700" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-night">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.excerpt}</p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Projects */}
      <Section tone="stone">
        <Reveal>
          <SectionHeading title={t('sectionProjects')} subtitle={t('projectsSubtitle')} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60}>
              <ProjectCard
                slug={p.slug}
                title={p.title}
                church={p.church?.name ?? null}
                progress={p.progress}
                goal={formatCurrency(p.budget.total, locale)}
                progressLabel={t('progress')}
                goalLabel={t('goal')}
                learnMoreLabel={t('learnMore')}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/projects" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto')}>
            {t('viewAllProjects')}
            <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* Visit */}
      <Section tone="white">
        <SacredMark className="mb-10 md:mb-12" />
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <h2 className="font-serif text-[34px] font-semibold leading-[1.1] tracking-tight text-night md:text-5xl">
              {t('sectionVisitTitle')}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{t('visitSubtitle')}</p>
            <ul className="mt-6 divide-y divide-hairline overflow-hidden rounded-card border border-hairline/80 bg-linen">
              {visitItems.map((item) => (
                <li key={item} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
                  <span className="text-night">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/visit" className={cn(buttonVariants({ size: 'lg' }), 'mt-8 w-full sm:w-auto')}>
              {t('ctaPlanVisit')}
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={60}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-stone-200 md:aspect-square">
              <Image src={VISIT_IMAGE} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Follow the journey */}
      <Section tone="dark" containerSize="base">
        <Reveal className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gold" aria-hidden="true" />
          <h2 className="mt-6 font-serif text-[34px] font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t('sectionFollowJourney')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/75">{t('followSubtitle')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/explore" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              {t('ctaFollowExplore')}
            </Link>
            <Link href="/explore" className={buttonVariants({ variant: 'glass', size: 'lg' })}>
              {t('ctaLearnMore')}
            </Link>
          </div>
        </Reveal>
      </Section>
    </div>
  );
}
