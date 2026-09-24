import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { isValidLocale } from '@/lib/i18n/config';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Card } from '@/components/ui/card';
import { DEMO_STORIES } from '@/lib/demo/data';

export default async function StoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('StoriesPage');

  return (
    <Section tone="white">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-8 md:grid-cols-2">
        {DEMO_STORIES.map((s) => (
          <Card key={s.slug} className="p-8">
            <div className="flex items-start gap-6">
              <div className="rounded-full bg-stone-100 p-4">
                <BookOpen className="h-8 w-8 text-stone-700" aria-hidden="true" />
              </div>
              <div>
                <span className="mb-2 inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                  {s.category}
                </span>
                <h3 className="mb-3 text-2xl font-semibold text-stone-900">{s.title}</h3>
                <p className="leading-relaxed text-stone-600">{s.excerpt}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
