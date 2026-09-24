import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, MapPin, BookOpen, Users, Heart, Calendar } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { TraditionCard } from '@/components/churches/TraditionCard';
import { ChurchCard } from '@/components/churches/ChurchCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { isValidLocale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { DEMO_CHURCHES, DEMO_PROJECTS } from '@/lib/demo/data';

// Featured content derived from the shared demo source so every card links to a
// real profile (replaced by Supabase queries on the data-wiring track).
const FEATURED_CHURCHES = DEMO_CHURCHES.map((c) => ({
  slug: c.slug,
  name: c.name,
  location: `${c.location.city}, ${c.location.country}`,
  tradition: c.tradition,
}));

const FEATURED_PROJECTS = DEMO_PROJECTS.map((p) => ({
  slug: p.slug,
  title: p.title,
  church: p.church?.name ?? null,
  progress: p.progress,
  goal: `$${p.budget.total.toLocaleString()}`,
}));

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  const traditions = [
    { key: 'catholic', href: '/explore?tradition=catholic', title: t('traditionCatholicTitle'), description: t('traditionCatholicDesc'), icon: BookOpen, accentClass: 'from-primary-100 to-primary-200', iconClass: 'text-primary-700' },
    { key: 'orthodox', href: '/explore?tradition=orthodox', title: t('traditionOrthodoxTitle'), description: t('traditionOrthodoxDesc'), icon: BookOpen, accentClass: 'from-blue-100 to-blue-200', iconClass: 'text-blue-700' },
    { key: 'armenian', href: '/explore?tradition=armenian', title: t('traditionArmenianTitle'), description: t('traditionArmenianDesc'), icon: BookOpen, accentClass: 'from-olive-100 to-olive-200', iconClass: 'text-olive-700' },
  ];

  const stories = [
    { title: t('story1Title'), excerpt: t('story1Excerpt'), icon: BookOpen },
    { title: t('story2Title'), excerpt: t('story2Excerpt'), icon: Users },
  ];

  const visitItems = [t('visitItem1'), t('visitItem2'), t('visitItem3'), t('visitItem4')];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-stone-50">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 opacity-50" aria-hidden="true" />
        <Container className="relative z-10 py-24 text-center">
          <h1 className="mb-8 font-serif text-5xl font-medium leading-tight text-stone-900 md:text-7xl">
            {t('heroHeadline')}
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-stone-600 md:text-2xl">
            {t('heroSubheadline')}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/explore" className={buttonVariants({ size: 'lg' })}>
              {t('ctaExplore')}
              <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
            <Link href="/explore?view=map" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <MapPin className="me-2 h-5 w-5" aria-hidden="true" />
              {t('ctaOpenMap')}
            </Link>
          </div>
        </Container>
      </section>

      {/* Explore by tradition */}
      <Section tone="white">
        <SectionHeading title={t('sectionExploreTitle')} subtitle={t('exploreSubtitle')} />
        <div className="grid gap-8 md:grid-cols-3">
          {traditions.map((tr) => (
            <TraditionCard key={tr.key} href={tr.href} title={tr.title} description={tr.description} icon={tr.icon} accentClass={tr.accentClass} iconClass={tr.iconClass} />
          ))}
        </div>
      </Section>

      {/* Featured churches */}
      <Section tone="stone">
        <SectionHeading title={t('sectionFeaturedChurches')} subtitle={t('featuredSubtitle')} />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_CHURCHES.map((c) => (
            <ChurchCard key={c.slug} slug={c.slug} name={c.name} location={c.location} tradition={c.tradition} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/explore" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {t('viewAllChurches')}
            <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* Stories */}
      <Section tone="white">
        <SectionHeading title={t('sectionStories')} subtitle={t('storiesSubtitle')} />
        <div className="grid gap-8 md:grid-cols-2">
          {stories.map((s) => (
            <Card key={s.title} className="p-8">
              <div className="flex items-start gap-6">
                <div className="rounded-full bg-stone-100 p-4">
                  <s.icon className="h-8 w-8 text-stone-700" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-semibold text-stone-900">{s.title}</h3>
                  <p className="leading-relaxed text-stone-600">{s.excerpt}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Projects */}
      <Section tone="stone">
        <SectionHeading title={t('sectionProjects')} subtitle={t('projectsSubtitle')} />
        <div className="grid gap-8 md:grid-cols-2">
          {FEATURED_PROJECTS.map((p) => (
            <ProjectCard
              key={p.slug}
              slug={p.slug}
              title={p.title}
              church={p.church}
              progress={p.progress}
              goal={p.goal}
              progressLabel={t('progress')}
              goalLabel={t('goal')}
              learnMoreLabel={t('learnMore')}
            />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/explore" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {t('viewAllProjects')}
            <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* Visit */}
      <Section tone="white">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 font-serif text-4xl text-stone-900">{t('sectionVisitTitle')}</h2>
            <p className="mb-8 text-lg leading-relaxed text-stone-600">{t('visitSubtitle')}</p>
            <ul className="space-y-4">
              {visitItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
                  <span className="text-stone-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/explore" className={buttonVariants({ size: 'lg' })}>
                {t('ctaPlanVisit')}
                <Calendar className="ms-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-stone-100">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-stone-200">
              <MapPin className="h-24 w-24 text-primary-700" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Section>

      {/* Follow the journey */}
      <Section tone="dark" containerSize="base">
        <div className="text-center">
          <Heart className="mx-auto mb-8 h-16 w-16 text-primary-500" aria-hidden="true" />
          <h2 className="mb-6 font-serif text-4xl">{t('sectionFollowJourney')}</h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-stone-300">
            {t('followSubtitle')}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/explore" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              {t('ctaFollowExplore')}
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white px-8 text-base font-medium text-white transition-colors hover:bg-white hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
            >
              {t('ctaLearnMore')}
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
