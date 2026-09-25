import { describe, expect, it, vi } from 'vitest';
import { churchEntityIds, mapChurch } from '@/lib/data/churches';
import { mapProject, projectEntityIds } from '@/lib/data/projects';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

const churchRow = {
  id: 'c1',
  slug: 'basilica-annunciation-nazareth',
  name: 'Basilica of the Annunciation',
  name_ar: 'كنيسة البشارة',
  name_he: 'בזיליקת הבשורה',
  status: 'LISTED',
  church_locations: [{ id: 'l1', city: 'Nazareth', region: 'Northern District', country: 'Israel', latitude: 32.7, longitude: 35.3 }],
  church_visiting_info: [{ id: 'v1', is_open_to_visitors: true, opening_hours: null, admission_info: 'Free admission.', accessibility_info: null }],
  church_descriptions: [
    { locale: 'en', overview: 'EN overview', story: 'EN story', heritage: '', community: 'EN community' },
    { locale: 'ru', overview: 'RU overview', story: 'RU story', heritage: '', community: 'RU community' },
  ],
  heritage_items: [{ id: 'h1', title: 'Annunciation Grotto', title_ar: null, title_he: null, item_type: 'Archaeological Site', date_period: '20th century', is_published: true }],
  church_updates: [{ id: 'u1', title: 'Christmas', title_ar: null, title_he: null, content: 'Join us', published_at: '2025-01-15T12:00:00Z', is_published: true }],
  denominations: { id: 'd1', name: 'Roman Catholic', name_ar: 'الكاثوليكية الرومانية', name_he: 'קתולית רומית' },
  projects: [{ id: 'p1', slug: 'basilica-restoration-phase1', title: 'Basilica Restoration - Phase 1', title_ar: null, title_he: null, is_published: true, project_budgets: [{ total_amount: 100, raised_amount: 25 }] }],
};

const ru = new Map([
  ['church:c1:name', 'Базилика Благовещения'],
  ['church_location:l1:city', 'Назарет'],
  ['denomination:d1:name', 'Римско-католическая церковь'],
  ['church_visiting_info:v1:admission_info', 'Вход свободный.'],
  ['heritage_item:h1:title', 'Грот Благовещения'],
  ['church_update:u1:title', 'Рождество'],
  ['project:p1:title', 'Реставрация базилики — этап 1'],
]);

describe('mapChurch', () => {
  it('overlays translations and falls back to English field by field', () => {
    const c = mapChurch(churchRow, 'ru', ru);
    expect(c.name).toBe('Базилика Благовещения');
    expect(c.location.city).toBe('Назарет');
    expect(c.location.country).toBe('Israel');
    expect(c.tradition).toBe('Римско-католическая церковь');
    expect(c.denomination).toBe('Римско-католическая церковь');
    expect(c.visitingInfo.admission).toBe('Вход свободный.');
    expect(c.visitingInfo.accessibility).toBeNull();
    expect(c.heritageItems[0]).toEqual({ title: 'Грот Благовещения', type: 'Archaeological Site', period: '20th century' });
    expect(c.updates[0].title).toBe('Рождество');
    expect(c.updates[0].content).toBe('Join us');
    expect(c.updates[0].date).toContain('января');
    expect(c.projects[0].title).toBe('Реставрация базилики — этап 1');
    expect(c.description.overview).toBe('RU overview');
  });

  it('uses the legacy Arabic columns when no translation exists', () => {
    const c = mapChurch(churchRow, 'ar');
    expect(c.name).toBe('كنيسة البشارة');
    expect(c.tradition).toBe('الكاثوليكية الرومانية');
    expect(c.description.overview).toBe('EN overview');
  });

  it('stays English for en', () => {
    const c = mapChurch(churchRow, 'en', ru);
    expect(c.name).toBe('Basilica of the Annunciation');
    expect(c.updates[0].date).toBe('January 15, 2025');
  });

  it('collects every translatable id', () => {
    expect(churchEntityIds(churchRow).sort()).toEqual(['c1', 'd1', 'h1', 'l1', 'p1', 'u1', 'v1']);
  });
});

const projectRow = {
  id: 'p1',
  slug: 'basilica-restoration-phase1',
  title: 'Basilica Restoration - Phase 1',
  title_ar: 'ترميم البازيليكا - المرحلة الأولى',
  title_he: 'שיקום הבזיליקה - שלב 1',
  short_description: 'Restoration of the main nave.',
  full_description: 'Full text.',
  category: 'Restoration',
  status: 'APPROVED',
  churches: { id: 'c1', slug: 'basilica-annunciation-nazareth', name: 'Basilica of the Annunciation', name_ar: 'كنيسة البشارة', name_he: 'בזיליקת הבשורה' },
  project_budgets: [{ id: 'b1', total_amount: 250000, raised_amount: 45000, currency: 'USD', budget_items: [{ item: 'Structural assessment', amount: 25000 }, { item: 'Facade cleaning', amount: 80000 }] }],
  project_timelines: [{ id: 't1', phase: 'Assessment', start_date: '2025-01-01', end_date: '2025-03-01', is_completed: true }],
  project_verifications: [],
  project_updates: [{ id: 'pu1', title: 'Assessment Complete', content: 'Done.', update_type: 'milestone', published_at: '2025-01-15T12:00:00Z', is_published: true }],
};

const de = new Map([
  ['project:p1:title', 'Restaurierung der Basilika – Phase 1'],
  ['project:p1:category', 'Restaurierung'],
  ['church:c1:name', 'Verkündigungsbasilika'],
  ['project_budget:b1:item.1', 'Fassadenreinigung'],
  ['project_timeline:t1:phase', 'Bewertung'],
  ['project_update:pu1:title', 'Bewertung abgeschlossen'],
]);

describe('mapProject', () => {
  it('overlays translations and falls back to English field by field', () => {
    const p = mapProject(projectRow, 'de', de);
    expect(p.title).toBe('Restaurierung der Basilika – Phase 1');
    expect(p.category).toBe('Restaurierung');
    expect(p.church?.name).toBe('Verkündigungsbasilika');
    expect(p.shortDescription).toBe('Restoration of the main nave.');
    expect(p.budgetItems.map((i) => i.item)).toEqual(['Structural assessment', 'Fassadenreinigung']);
    expect(p.timelines[0].phase).toBe('Bewertung');
    expect(p.updates[0].title).toBe('Bewertung abgeschlossen');
    expect(p.updates[0].date).toBe('15. Januar 2025');
    expect(p.progress).toBe(18);
  });

  it('uses the legacy Hebrew columns when no translation exists', () => {
    const p = mapProject(projectRow, 'he');
    expect(p.title).toBe('שיקום הבזיליקה - שלב 1');
    expect(p.church?.name).toBe('בזיליקת הבשורה');
  });

  it('stays English for en even if a map is passed', () => {
    const p = mapProject(projectRow, 'en', de);
    expect(p.title).toBe('Basilica Restoration - Phase 1');
    expect(p.category).toBe('Restoration');
    expect(p.church?.name).toBe('Basilica of the Annunciation');
  });

  it('collects every translatable id', () => {
    expect(projectEntityIds(projectRow).sort()).toEqual(['b1', 'c1', 'p1', 'pu1', 't1']);
  });
});
