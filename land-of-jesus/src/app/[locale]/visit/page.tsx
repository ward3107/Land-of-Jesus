import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Clock, Accessibility, Users, MapPin, ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
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
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 60}>
            <Card className="h-full p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-primary-100" aria-hidden="true">
                  <it.icon className="h-6 w-6 text-primary-700" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-night">{it.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{it.body}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
      <div className="mt-10">
        <Link href="/explore" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
          {t('cta')}
          <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
