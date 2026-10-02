import english from '../../../supabase/content-i18n/en.json';
import { DEMO_CHURCHES, DEMO_PROJECTS, type DemoChurch, type DemoProject } from '@/lib/demo/data';
import type { Locale } from '@/lib/i18n/config';

type Content = {
  fields: Record<string, string>;
  descriptions: Record<string, { overview?: string; story?: string; community?: string }>;
};

const load: Record<Locale, () => Promise<Content>> = {
  en: async () => (await import('../../../supabase/content-i18n/en.json')).default,
  ar: async () => (await import('../../../supabase/content-i18n/ar.json')).default,
  he: async () => (await import('../../../supabase/content-i18n/he.json')).default,
  es: async () => (await import('../../../supabase/content-i18n/es.json')).default,
  pt: async () => (await import('../../../supabase/content-i18n/pt.json')).default,
  fr: async () => (await import('../../../supabase/content-i18n/fr.json')).default,
  it: async () => (await import('../../../supabase/content-i18n/it.json')).default,
  de: async () => (await import('../../../supabase/content-i18n/de.json')).default,
  pl: async () => (await import('../../../supabase/content-i18n/pl.json')).default,
  ro: async () => (await import('../../../supabase/content-i18n/ro.json')).default,
  el: async () => (await import('../../../supabase/content-i18n/el.json')).default,
  ru: async () => (await import('../../../supabase/content-i18n/ru.json')).default,
  uk: async () => (await import('../../../supabase/content-i18n/uk.json')).default,
  hy: async () => (await import('../../../supabase/content-i18n/hy.json')).default,
  ka: async () => (await import('../../../supabase/content-i18n/ka.json')).default,
  am: async () => (await import('../../../supabase/content-i18n/am.json')).default,
  hi: async () => (await import('../../../supabase/content-i18n/hi.json')).default,
  zh: async () => (await import('../../../supabase/content-i18n/zh.json')).default,
  ja: async () => (await import('../../../supabase/content-i18n/ja.json')).default,
  ko: async () => (await import('../../../supabase/content-i18n/ko.json')).default,
  fil: async () => (await import('../../../supabase/content-i18n/fil.json')).default,
  id: async () => (await import('../../../supabase/content-i18n/id.json')).default,
  nl: async () => (await import('../../../supabase/content-i18n/nl.json')).default,
  sv: async () => (await import('../../../supabase/content-i18n/sv.json')).default,
  cs: async () => (await import('../../../supabase/content-i18n/cs.json')).default,
  hu: async () => (await import('../../../supabase/content-i18n/hu.json')).default,
  sr: async () => (await import('../../../supabase/content-i18n/sr.json')).default,
  bg: async () => (await import('../../../supabase/content-i18n/bg.json')).default,
  hr: async () => (await import('../../../supabase/content-i18n/hr.json')).default,
  tr: async () => (await import('../../../supabase/content-i18n/tr.json')).default,
  vi: async () => (await import('../../../supabase/content-i18n/vi.json')).default,
  ml: async () => (await import('../../../supabase/content-i18n/ml.json')).default,
};

const churchIds = new Map(
  Object.entries(english.fields)
    .filter(([key]) => key.startsWith('church:') && key.endsWith(':name'))
    .map(([key, name]) => [name, key.split(':')[1]]),
);

const projectIds: Record<string, string> = {
  'basilica-restoration-phase1': '20000000-0000-0000-0000-000000000001',
  'heritage-documentation-project': '20000000-0000-0000-0000-000000000002',
};

function exactTranslation(content: Content, englishText: string): string {
  const key = Object.keys(english.fields).find((field) => english.fields[field as keyof typeof english.fields] === englishText);
  return key ? content.fields[key] || englishText : englishText;
}

export async function getLocalizedDemoChurches(locale: Locale): Promise<DemoChurch[]> {
  if (locale === 'en') return DEMO_CHURCHES;
  const content = await load[locale]();
  return DEMO_CHURCHES.map((church) => {
    const id = churchIds.get(church.name);
    const description = id ? content.descriptions[id] : undefined;
    const field = (name: string, fallback: string) => id ? content.fields[`church:${id}:${name}`] || fallback : fallback;
    return {
      ...church,
      name: field('name', church.name),
      tradition: field('tradition', exactTranslation(content, church.tradition)),
      denomination: field('denomination', exactTranslation(content, church.denomination)),
      location: {
        ...church.location,
        city: exactTranslation(content, church.location.city),
        country: exactTranslation(content, church.location.country),
      },
      description: {
        ...church.description,
        overview: description?.overview || church.description.overview,
        story: description?.story || church.description.story,
        community: description?.community || church.description.community,
      },
      visitingInfo: {
        ...church.visitingInfo,
        admission: church.visitingInfo.admission ? exactTranslation(content, church.visitingInfo.admission) : null,
        accessibility: church.visitingInfo.accessibility ? exactTranslation(content, church.visitingInfo.accessibility) : null,
      },
      heritageItems: church.heritageItems.map((item) => ({
        ...item, title: exactTranslation(content, item.title), type: exactTranslation(content, item.type),
        period: exactTranslation(content, item.period),
      })),
      projects: church.projects.map((project) => ({ ...project, title: exactTranslation(content, project.title) })),
      updates: church.updates.map((update) => ({
        ...update, title: exactTranslation(content, update.title), content: exactTranslation(content, update.content),
      })),
    };
  });
}

export async function getLocalizedDemoProjects(locale: Locale): Promise<DemoProject[]> {
  if (locale === 'en') return DEMO_PROJECTS;
  const content = await load[locale]();
  return DEMO_PROJECTS.map((project) => {
    const id = projectIds[project.slug];
    const field = (name: string, fallback: string) => id ? content.fields[`project:${id}:${name}`] || fallback : fallback;
    return {
      ...project,
      title: field('title', project.title),
      shortDescription: field('short_description', project.shortDescription),
      fullDescription: field('full_description', project.fullDescription),
      category: field('category', project.category),
      church: project.church ? { ...project.church, name: exactTranslation(content, project.church.name) } : null,
      timelines: project.timelines.map((timeline) => ({
        ...timeline, phase: exactTranslation(content, timeline.phase),
      })),
      budgetItems: project.budgetItems.map((item) => ({
        ...item, item: exactTranslation(content, item.item),
      })),
      updates: project.updates.map((update) => ({
        ...update, title: exactTranslation(content, update.title), content: exactTranslation(content, update.content),
      })),
    };
  });
}
