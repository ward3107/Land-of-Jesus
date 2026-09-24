import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, FileText, Shield, TrendingUp, Users } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/layout/Container';
import { ProfileSection } from '@/components/common/ProfileSection';
import { ProgressBar } from '@/components/projects/ProgressBar';
import { isValidLocale } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';
import { getProjectBySlug } from '@/lib/data/projects';

interface ProjectProfilePageProps {
  params: Promise<{ slug: string; locale: string }>;
}


export default async function ProjectProfilePage({ params }: ProjectProfilePageProps) {
  const { slug, locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  // Live Supabase data (falls back to bundled demo data on error/empty).
  const project = await getProjectBySlug(slug, locale);
  if (!project) notFound();

  const t = await getTranslations('ProjectProfile');
  const progressPercent = (project.budget.raised / project.budget.total) * 100;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-900 py-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 to-stone-900" aria-hidden="true" />
        <Container className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm">{project.category}</span>
            <span className="flex items-center gap-1 rounded-full bg-green-600/80 px-3 py-1 text-sm text-white backdrop-blur-sm">
              <Shield className="h-3 w-3" aria-hidden="true" />
              {t('verified')}
            </span>
          </div>
          <h1 className="mb-4 font-serif text-4xl md:text-5xl">{project.title}</h1>
          <p className="mb-6 max-w-3xl text-xl text-stone-300">{project.shortDescription}</p>
          {project.church && (
            <Link
              href={`/churches/${project.church.slug}`}
              className="inline-flex items-center text-primary-300 transition-colors hover:text-primary-200"
            >
              <Users className="me-2 h-5 w-5" aria-hidden="true" />
              {project.church.name}
              <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          )}
        </Container>
      </section>

      {/* Funding progress */}
      <div className="border-b border-primary-200 bg-primary-50">
        <Container className="py-8">
          <div className="grid items-center gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <ProgressBar
                value={progressPercent}
                label={t('fundingProgress')}
                valueLabel={`${progressPercent.toFixed(0)}%`}
              />
              <div className="mt-2 flex justify-between text-sm text-stone-600">
                <span>{t('raised')}: ${project.budget.raised.toLocaleString()}</span>
                <span>{t('goal')}: ${project.budget.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center md:text-end">
              <p className="mb-1 text-sm text-stone-600">{t('prototypeLabel')}</p>
              <p className="inline-block rounded-lg bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-800">
                {t('prototypeNotice')}
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Main content */}
      <Container className="py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <ProfileSection title={t('whyThisMatters')}>
              <p className="text-lg leading-relaxed text-stone-700">{project.fullDescription}</p>
            </ProfileSection>

            <ProfileSection title={t('currentCondition')}>
              <Card className="p-6">
                <p className="leading-relaxed text-stone-700">
                  The basilica shows signs of weathering and structural stress after decades of exposure.
                  The facade requires careful cleaning and repointing, while the roof needs waterproofing to
                  prevent water damage to the interior. This restoration will preserve this sacred site for
                  future generations of pilgrims and worshippers.
                </p>
              </Card>
            </ProfileSection>

            <ProfileSection title={t('plan')}>
              <div className="space-y-4">
                {project.timelines.map((tl, idx) => (
                  <Card key={idx} className={`p-4 ${tl.completed ? 'border-green-200 bg-green-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${tl.completed ? 'bg-green-600' : 'bg-primary-600'}`} aria-hidden="true" />
                        <div>
                          <h3 className="font-semibold text-stone-900">{tl.phase}</h3>
                          <p className="text-sm text-stone-600">
                            {formatDate(tl.startDate, locale)} – {formatDate(tl.endDate, locale)}
                          </p>
                        </div>
                      </div>
                      {tl.completed && (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          {t('completed')}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ProfileSection>

            <ProfileSection title={t('budgetBreakdown')}>
              <Card className="p-6">
                <dl className="space-y-3">
                  {project.budgetItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-stone-100 py-2 last:border-0">
                      <dt className="text-stone-700">{item.item}</dt>
                      <dd className="font-medium text-stone-900">${item.amount.toLocaleString()}</dd>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center justify-between border-t-2 border-stone-200 pt-4">
                    <dt className="text-lg font-semibold text-stone-900">{t('total')}</dt>
                    <dd className="text-lg font-bold text-primary-700">${project.budget.total.toLocaleString()}</dd>
                  </div>
                </dl>
              </Card>
            </ProfileSection>

            <ProfileSection title={t('verification')}>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <Shield className="h-6 w-6 text-green-700" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-900">{t('projectDocumentsVerified')}</h3>
                    <p className="mb-2 text-sm text-stone-600">{t('verificationBody')}</p>
                    <p className="text-xs text-stone-500">
                      {t('reviewedOn')} {formatDate(project.verification.reviewedAt, locale)}
                    </p>
                  </div>
                </div>
              </Card>
            </ProfileSection>

            <ProfileSection title={t('updates')}>
              <div className="space-y-4">
                {project.updates.map((update, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-sm text-stone-500">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      <span className="capitalize">{update.type}</span>
                      <span>•</span>
                      <span>{update.date}</span>
                    </div>
                    <h3 className="mb-2 font-semibold text-stone-900">{update.title}</h3>
                    <p className="text-stone-700">{update.content}</p>
                  </Card>
                ))}
              </div>
            </ProfileSection>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Support — PROTOTYPE ONLY, payment intentionally disabled */}
            <Card className="border-primary-200 bg-primary-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-stone-900">{t('supportTitle')}</h3>
              <p className="mb-4 text-sm text-stone-600">{t('supportBody')}</p>
              <div className="mb-4 rounded-lg bg-primary-100 p-3">
                <p className="text-xs font-medium text-primary-800">⚠️ {t('prototypeNotice')}</p>
              </div>
              <button disabled className={`${buttonVariants({ size: 'lg' })} mb-3 w-full`}>
                {t('supportDisabled')}
              </button>
              <p className="text-center text-xs text-stone-500">{t('paymentComingSoon')}</p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-stone-900">{t('projectDetails')}</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-stone-500">{t('category')}</dt>
                  <dd className="font-medium text-stone-900">{project.category}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">{t('status')}</dt>
                  <dd className="font-medium capitalize text-green-700">{project.status.toLowerCase().replace('_', ' ')}</dd>
                </div>
                {project.church && (
                  <div>
                    <dt className="text-sm text-stone-500">{t('church')}</dt>
                    <dd className="font-medium text-stone-900">
                      <Link href={`/churches/${project.church.slug}`} className="text-primary-700 hover:underline">
                        {project.church.name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-stone-500">{t('verification')}</dt>
                  <dd className="flex items-center gap-1 font-medium text-green-700">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    {t('verified')}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900">
                <FileText className="h-5 w-5" aria-hidden="true" />
                {t('documents')}
              </h3>
              <p className="mb-4 text-sm text-stone-600">{t('documentsBody')}</p>
              <button className={`${buttonVariants({ variant: 'outline', size: 'sm' })} w-full`}>
                {t('requestDocuments')}
              </button>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-stone-900">{t('shareProject')}</h3>
              <div className="flex gap-2">
                <button className={`${buttonVariants({ variant: 'outline', size: 'sm' })} flex-1`}>Facebook</button>
                <button className={`${buttonVariants({ variant: 'outline', size: 'sm' })} flex-1`}>Twitter</button>
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
