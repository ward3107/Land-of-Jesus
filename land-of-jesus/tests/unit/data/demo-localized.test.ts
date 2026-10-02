import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/config';
import { DEMO_CHURCHES, DEMO_PROJECTS } from '@/lib/demo/data';
import { getLocalizedDemoChurches, getLocalizedDemoProjects } from '@/lib/data/demo-localized';

describe.each(locales)('localized fallback content for %s', (locale) => {
  it('keeps every church and project available in the selected language', async () => {
    const [churches, projects] = await Promise.all([
      getLocalizedDemoChurches(locale), getLocalizedDemoProjects(locale),
    ]);
    expect(churches).toHaveLength(DEMO_CHURCHES.length);
    expect(projects).toHaveLength(DEMO_PROJECTS.length);
    expect(churches[0].name.trim()).toBeTruthy();
    expect(churches.at(-1)?.description.overview.trim()).toBeTruthy();
    expect(projects[0].title.trim()).toBeTruthy();
    if (locale !== 'en') {
      expect(churches[0].name).not.toBe(DEMO_CHURCHES[0].name);
      expect(projects[0].title).not.toBe(DEMO_PROJECTS[0].title);
    }
  });
});
