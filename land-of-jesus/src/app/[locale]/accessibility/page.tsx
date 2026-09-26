import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Check, Mail } from 'lucide-react';
import { isValidLocale } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/card';

const REVIEW_DATE = '2026-09-26';
const NEXT_REVIEW_DATE = '2027-09-26';
const CONTACT_EMAIL = 'wasya92@gmail.com';
const COORDINATOR_NAME = 'Waseem';
const FEATURE_KEYS = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9', 'feature10'] as const;

export default async function AccessibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Accessibility');

  return (
    <Section tone="stone" containerSize="base">
      <h1 className="font-serif text-[34px] font-semibold leading-[1.1] tracking-tight text-night md:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{t('intro')}</p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="mb-3 font-serif text-2xl font-semibold text-night">{t('conformanceTitle')}</h2>
          <p className="leading-relaxed text-night/80">
            {t('conformanceBody', {
              date: formatDate(REVIEW_DATE, locale),
              nextDate: formatDate(NEXT_REVIEW_DATE, locale),
            })}
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-serif text-2xl font-semibold text-night">{t('featuresTitle')}</h2>
          <ul className="space-y-3">
            {FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-hills" aria-hidden="true" />
                <span className="leading-relaxed text-night/80">{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-2xl font-semibold text-night">{t('limitationsTitle')}</h2>
          <p className="leading-relaxed text-night/80">{t('limitationsBody')}</p>
        </section>

        <Card className="p-6 md:p-8">
          <h2 className="mb-4 font-serif text-2xl font-semibold text-night">{t('contactTitle')}</h2>
          <dl className="space-y-2 text-night/80">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-night">{COORDINATOR_NAME}</dt>
              <dd className="text-muted">· {t('contactRole')}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <dt className="sr-only">{t('contactEmailLabel')}</dt>
              <dd>
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary-700 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted">{t('contactResponse')}</p>
        </Card>

        <section>
          <h2 className="mb-3 font-serif text-2xl font-semibold text-night">{t('reportTitle')}</h2>
          <p className="leading-relaxed text-night/80">{t('reportBody')}</p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-2xl font-semibold text-night">{t('improvementTitle')}</h2>
          <p className="leading-relaxed text-night/80">{t('improvementBody')}</p>
        </section>
      </div>
    </Section>
  );
}
