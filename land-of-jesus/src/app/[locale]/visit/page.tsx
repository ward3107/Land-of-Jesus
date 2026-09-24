import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Clock, Accessibility, Users, MapPin, ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export default async function VisitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('VisitPage');

  const items = [
    { icon: Clock, title: t('hoursTitle'), body: t('hoursBody') },
    { icon: Accessibility, title: t('accessTitle'), body: t('accessBody') },
    { icon: Users, title: t('toursTitle'), body: t('toursBody') },
    { icon: MapPin, title: t('stayTitle'), body: t('stayBody') },
  ];

  return (
    <Section tone="white">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-8 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.title} className="p-8">
            <div className="flex items-start gap-6">
              <div className="rounded-full bg-primary-50 p-4">
                <it.icon className="h-8 w-8 text-primary-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-stone-900">{it.title}</h3>
                <p className="leading-relaxed text-stone-600">{it.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link href="/explore" className={buttonVariants({ size: 'lg' })}>
          {t('cta')}
          <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
