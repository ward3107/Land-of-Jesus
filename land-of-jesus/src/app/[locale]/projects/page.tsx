import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { formatCurrency } from '@/lib/utils';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getProjects } from '@/lib/data/projects';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('ProjectsPage');
  const tc = await getTranslations('Common');
  const projects = await getProjects(locale);

  return (
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 5) * 60}>
            <ProjectCard
              slug={p.slug}
              title={p.title}
              church={p.church?.name ?? null}
              progress={p.progress}
              goal={formatCurrency(p.budget.total, locale)}
              progressLabel={tc('progress')}
              goalLabel={tc('goal')}
              learnMoreLabel={tc('learnMore')}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
