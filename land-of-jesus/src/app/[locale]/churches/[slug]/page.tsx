import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPin, Clock, Calendar, Heart, Share2, Bookmark } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/layout/Container';
import { ProfileSection } from '@/components/common/ProfileSection';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { ProgressBar } from '@/components/projects/ProgressBar';
import { isValidLocale } from '@/lib/i18n/config';
import { getDemoChurch } from '@/lib/demo/data';

interface ChurchProfilePageProps {
  params: Promise<{ slug: string; locale: string }>;
}


export default async function ChurchProfilePage({ params }: ChurchProfilePageProps) {
  const { slug, locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  // Shared demo source (replaced with a Supabase query in production).
  const church = getDemoChurch(slug);
  if (!church) notFound();

  const t = await getTranslations('ChurchProfile');

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <ImagePlaceholder
          src={null}
          alt={church.name}
          ratio="wide"
          className="absolute inset-0 h-full w-full"
          iconClassName="h-32 w-32"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8 md:p-12">
          <Container>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm">{church.tradition}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm">{church.denomination}</span>
            </div>
            <h1 className="mb-4 font-serif text-4xl text-white md:text-6xl">{church.name}</h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              <span className="text-lg">
                {church.location.city}, {church.location.country}
              </span>
            </div>
          </Container>
        </div>
      </section>

      {/* Actions bar */}
      <div className="sticky top-16 z-10 border-b border-stone-200 bg-white shadow-sm">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-wrap gap-3">
            <span className={buttonVariants({ size: 'lg' })}>
              <Calendar className="me-2 h-5 w-5" aria-hidden="true" />
              {t('planVisit')}
            </span>
            <button className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <Heart className="me-2 h-5 w-5" aria-hidden="true" />
              {t('follow')}
            </button>
            <button className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
              <Bookmark className="me-2 h-5 w-5" aria-hidden="true" />
              {t('save')}
            </button>
          </div>
          <button className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
            <Share2 className="me-2 h-5 w-5" aria-hidden="true" />
            {t('share')}
          </button>
        </Container>
      </div>

      {/* Main content */}
      <Container className="py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <ProfileSection title={t('overview')}>
              <p className="text-lg leading-relaxed text-stone-700">{church.description.overview}</p>
            </ProfileSection>

            <ProfileSection title={t('story')}>
              <p className="leading-relaxed text-stone-700">{church.description.story}</p>
            </ProfileSection>

            {church.heritageItems.length > 0 && (
              <ProfileSection title={t('heritage')}>
                <div className="grid gap-6 sm:grid-cols-2">
                  {church.heritageItems.map((item, idx) => (
                    <Card key={idx} className="p-6">
                      <h3 className="mb-2 font-semibold text-stone-900">{item.title}</h3>
                      <div className="space-y-1 text-sm text-stone-600">
                        <p>{t('typeLabel')}: {item.type}</p>
                        <p>{t('periodLabel')}: {item.period}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </ProfileSection>
            )}

            <ProfileSection title={t('community')}>
              <p className="leading-relaxed text-stone-700">{church.description.community}</p>
            </ProfileSection>

            {church.projects.length > 0 && (
              <ProfileSection title={t('projects')}>
                <div className="space-y-4">
                  {church.projects.map((project) => (
                    <Card key={project.slug} className="p-6">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <h3 className="mb-3 text-xl font-semibold text-stone-900">{project.title}</h3>
                        <ProgressBar className="mb-4" value={project.progress} label={t('progress')} valueLabel={`${project.progress}%`} />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-600">{t('goal')}: {project.goal}</span>
                          <span className="text-sm font-medium text-primary-700">{t('learnMore')} →</span>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              </ProfileSection>
            )}

            {church.updates.length > 0 && (
              <ProfileSection title={t('updates')}>
                <div className="space-y-4">
                  {church.updates.map((update, idx) => (
                    <Card key={idx} className="p-6">
                      <div className="mb-2 flex items-center gap-2 text-sm text-stone-500">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>{update.date}</span>
                      </div>
                      <h3 className="mb-2 font-semibold text-stone-900">{update.title}</h3>
                      <p className="text-stone-700">{update.content}</p>
                    </Card>
                  ))}
                </div>
              </ProfileSection>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-stone-900">{t('quickFacts')}</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-stone-500">{t('tradition')}</dt>
                  <dd className="font-medium text-stone-900">{church.tradition}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">{t('denomination')}</dt>
                  <dd className="font-medium text-stone-900">{church.denomination}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">{t('location')}</dt>
                  <dd className="font-medium text-stone-900">{church.location.city}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">{t('status')}</dt>
                  <dd className="flex items-center gap-1 font-medium text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                    {t('openToVisitors')}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-stone-900">{t('visitInfo')}</h3>
              <div className="space-y-4">
                {church.visitingInfo.hours ? (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-stone-900">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {t('openingHours')}
                    </h4>
                    <dl className="space-y-1 text-sm">
                      {Object.entries(church.visitingInfo.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <dt className="capitalize text-stone-600">{day.slice(0, 3)}</dt>
                          <dd className="text-stone-900">{hours}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="text-sm text-stone-600">{t('hoursUnavailable')}</p>
                )}

                <div className="border-t border-stone-200 pt-4">
                  <h4 className="mb-2 font-medium text-stone-900">{t('admission')}</h4>
                  <p className="text-sm text-stone-700">{church.visitingInfo.admission || t('notSpecified')}</p>
                </div>

                <div className="border-t border-stone-200 pt-4">
                  <h4 className="mb-2 font-medium text-stone-900">{t('accessibility')}</h4>
                  <p className="text-sm text-stone-700">{church.visitingInfo.accessibility || t('notSpecified')}</p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex aspect-square items-center justify-center bg-stone-100">
                <div className="p-6 text-center">
                  <MapPin className="mx-auto mb-3 h-12 w-12 text-stone-300" aria-hidden="true" />
                  <p className="text-sm text-stone-500">{t('mapComingSoon')}</p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
