import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { isValidLocale } from '@/lib/i18n/config';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { Card } from '@/components/ui/card';
import { DEMO_STORIES } from '@/lib/demo/data';

export default async function StoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('StoriesPage');

  return (
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_STORIES.map((s, i) => (
          <Reveal key={s.slug} delay={Math.min(i, 5) * 60}>
            <Card className="h-full p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-stone-100" aria-hidden="true">
                  <BookOpen className="h-6 w-6 text-stone-700" />
                </span>
                <div>
                  <span className="inline-block rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {s.category}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold text-night">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.excerpt}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
