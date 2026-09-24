import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { DEMO_PROJECTS } from '@/lib/demo/data';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('ProjectsPage');
  const tc = await getTranslations('Common');

  return (
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-8 md:grid-cols-2">
        {DEMO_PROJECTS.map((p) => (
          <ProjectCard
            key={p.slug}
            slug={p.slug}
            title={p.title}
            church={p.church?.name ?? null}
            progress={p.progress}
            goal={`$${p.budget.total.toLocaleString()}`}
            progressLabel={tc('progress')}
            goalLabel={tc('goal')}
            learnMoreLabel={tc('learnMore')}
          />
        ))}
      </div>
    </Section>
  );
}
