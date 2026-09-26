/**
 * Shared demo data for the public pages.
 *
 * TEMPORARY: replaced by Supabase queries on the data-wiring track. Kept in ONE
 * place so every card links to a profile that actually exists (no dead links)
 * and so home/explore/profile never drift.
 *
 * Content is deliberately *illustrative*: real, well-known church names are used
 * for realism, but no unverified specifics (opening hours, verification badges,
 * denominations-as-fact) are asserted — matching docs/STITCH-MIGRATION.md.
 */

import { MORE_CHURCHES } from './more-churches';

export interface DemoChurch {
  slug: string;
  name: string;
  name_ar: string;
  name_he: string;
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  tradition: string;
  denomination: string;
  status: 'LOJ_VERIFIED' | 'LISTED' | 'DISCOVERED';
  description: { overview: string; story: string; heritage: string; community: string };
  visitingInfo: {
    isOpen: boolean | null;
    hours: Record<string, string> | null;
    admission: string | null;
    accessibility: string | null;
  };
  heritageItems: Array<{ title: string; type: string; period: string }>;
  projects: Array<{ slug: string; title: string; progress: number; goal: string; status: string }>;
  updates: Array<{ title: string; date: string; content: string }>;
  /** Card flags for Explore. */
  hasProjects: boolean;
  /** Local free-licensed photo of the actual site (public/images/...). */
  image: string;
  /** Attribution for the photo — Wikimedia Commons author + license. */
  imageCredit?: { author: string; license: string };
}

const ILLUSTRATIVE = 'Detailed, verified information will appear here once confirmed with the church and its custodians. The description below is illustrative.';

// Real, free-licensed photographs (Wikimedia Commons) downloaded into
// public/images so they always load — no external requests or rate limits.
/** Shared hero + section imagery for the public pages. */
export const HERO_IMAGE = '/images/hero-jerusalem.jpg';
export const VISIT_IMAGE = '/images/visit.jpg';

export const DEMO_CHURCHES: DemoChurch[] = [
  {
    slug: 'basilica-annunciation-nazareth',
    image: '/images/churches/annunciation.jpg',
    name: 'Basilica of the Annunciation',
    name_ar: 'كنيسة البشارة',
    name_he: 'בזיליקת הבשורה',
    location: { address: '—', city: 'Nazareth', region: 'Northern District', country: 'Israel', latitude: 32.7021, longitude: 35.2978 },
    tradition: 'Roman Catholic',
    denomination: 'Latin Church',
    status: 'LISTED',
    description: {
      overview: `One of the most significant Christian sites in the Holy Land, in the heart of Nazareth. ${ILLUSTRATIVE}`,
      story: 'This section will present the site’s history, sourced from verified records. Placeholder content shown during development.',
      heritage: 'Heritage details (architecture, art, archaeology) will be listed here once documented and reviewed.',
      community: 'Information about the living community that cares for this place will be provided by verified representatives.',
    },
    visitingInfo: { isOpen: true, hours: null, admission: 'Please contact the church directly for current visiting information.', accessibility: null },
    heritageItems: [],
    projects: [{ slug: 'basilica-restoration-phase1', title: 'Basilica Restoration — Phase 1', progress: 18, goal: '$250,000', status: 'APPROVED' }],
    updates: [],
    hasProjects: true,
  },
  {
    slug: 'church-nativity-bethlehem',
    image: '/images/churches/nativity.jpg',
    name: 'Church of the Nativity',
    name_ar: 'كنيسة المهد',
    name_he: 'כנסיית המולד',
    location: { address: '—', city: 'Bethlehem', region: 'West Bank', country: 'Palestine', latitude: 31.7042, longitude: 35.2077 },
    tradition: 'Greek Orthodox',
    denomination: 'Shared custody',
    status: 'LISTED',
    description: {
      overview: `A revered pilgrimage site in Bethlehem. ${ILLUSTRATIVE}`,
      story: 'This section will present the site’s history, sourced from verified records. Placeholder content shown during development.',
      heritage: 'Heritage details will be listed here once documented and reviewed.',
      community: 'Information about the community that cares for this place will be provided by verified representatives.',
    },
    visitingInfo: { isOpen: true, hours: null, admission: 'Please contact the church directly for current visiting information.', accessibility: null },
    heritageItems: [],
    projects: [],
    updates: [],
    hasProjects: false,
  },
  {
    slug: 'holy-sepulchre-jerusalem',
    image: '/images/churches/holy-sepulchre.jpg',
    name: 'Church of the Holy Sepulchre',
    name_ar: 'كنيسة القيامة',
    name_he: 'כנסיית הקבר',
    location: { address: '—', city: 'Jerusalem', region: 'Old City', country: 'Israel', latitude: 31.7784, longitude: 35.2294 },
    tradition: 'Multiple traditions',
    denomination: 'Shared custody (Status Quo)',
    status: 'LISTED',
    description: {
      overview: `A site of central importance to many Christian traditions, in the Old City of Jerusalem. ${ILLUSTRATIVE}`,
      story: 'This section will present the site’s history, sourced from verified records. Placeholder content shown during development.',
      heritage: 'Heritage details will be listed here once documented and reviewed.',
      community: 'Information about the communities that share custody of this place will be provided by verified representatives.',
    },
    visitingInfo: { isOpen: true, hours: null, admission: 'Please contact the church directly for current visiting information.', accessibility: null },
    heritageItems: [],
    projects: [],
    updates: [],
    hasProjects: false,
  },
  ...MORE_CHURCHES,
];

export function getDemoChurch(slug: string): DemoChurch | undefined {
  return DEMO_CHURCHES.find((c) => c.slug === slug);
}

export interface DemoProject {
  slug: string;
  title: string;
  title_ar: string;
  title_he: string;
  church: { slug: string; name: string } | null;
  shortDescription: string;
  fullDescription: string;
  category: string;
  status: string;
  budget: { total: number; raised: number; currency: string };
  progress: number;
  timelines: Array<{ phase: string; startDate: string; endDate: string; completed: boolean }>;
  budgetItems: Array<{ item: string; amount: number }>;
  verification: { status: string; type: string; reviewedAt: string };
  updates: Array<{ title: string; content: string; type: string; date: string }>;
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    slug: 'basilica-restoration-phase1',
    title: 'Basilica Restoration — Phase 1',
    title_ar: 'ترميم البازيليكا - المرحلة الأولى',
    title_he: 'שיקום הבזיליקה - שלב 1',
    church: { slug: 'basilica-annunciation-nazareth', name: 'Basilica of the Annunciation' },
    shortDescription: 'Restoration of the main nave and facade of the Basilica of the Annunciation.',
    fullDescription:
      'This project focuses on critical restoration needs including structural repairs, cleaning of the facade, and preservation of original architectural elements. Figures and timelines below are illustrative demo data.',
    category: 'Restoration',
    status: 'APPROVED',
    budget: { total: 250000, raised: 45000, currency: 'USD' },
    progress: 18,
    timelines: [
      { phase: 'Assessment', startDate: '2025-01-01', endDate: '2025-03-31', completed: true },
      { phase: 'Facade Work', startDate: '2025-04-01', endDate: '2025-08-31', completed: false },
      { phase: 'Interior Restoration', startDate: '2025-09-01', endDate: '2025-12-31', completed: false },
    ],
    budgetItems: [
      { item: 'Structural assessment', amount: 25000 },
      { item: 'Facade cleaning', amount: 80000 },
      { item: 'Stone repair', amount: 100000 },
      { item: 'Roof waterproofing', amount: 45000 },
    ],
    verification: { status: 'VERIFIED', type: 'PROJECT_DOCUMENTS', reviewedAt: '2025-01-15' },
    updates: [
      { title: 'Assessment Complete', content: 'The structural assessment phase has been completed. (Illustrative demo update.)', type: 'milestone', date: '10 days ago' },
    ],
  },
  {
    slug: 'heritage-documentation-project',
    title: 'Holy Land Heritage Documentation',
    title_ar: 'توثيق تراث الأرض المقدسة',
    title_he: 'תיעוד מורשת ארץ הקודש',
    church: null,
    shortDescription: 'A programme to document and photograph Christian heritage sites across the Holy Land.',
    fullDescription:
      'A cross-site documentation effort to record architecture, art and oral history before they are lost. Figures and timelines below are illustrative demo data.',
    category: 'Documentation',
    status: 'APPROVED',
    budget: { total: 150000, raised: 78000, currency: 'USD' },
    progress: 52,
    timelines: [
      { phase: 'Survey & Planning', startDate: '2025-02-01', endDate: '2025-04-30', completed: true },
      { phase: 'Field Documentation', startDate: '2025-05-01', endDate: '2025-10-31', completed: false },
      { phase: 'Archive & Publish', startDate: '2025-11-01', endDate: '2026-02-28', completed: false },
    ],
    budgetItems: [
      { item: 'Field team & equipment', amount: 60000 },
      { item: 'Photography & scanning', amount: 45000 },
      { item: 'Archival platform', amount: 30000 },
      { item: 'Translation & publishing', amount: 15000 },
    ],
    verification: { status: 'VERIFIED', type: 'PROJECT_DOCUMENTS', reviewedAt: '2025-02-20' },
    updates: [
      { title: 'Survey Complete', content: 'Initial survey of priority sites is complete. (Illustrative demo update.)', type: 'milestone', date: '3 weeks ago' },
    ],
  },
];

export function getDemoProject(slug: string): DemoProject | undefined {
  return DEMO_PROJECTS.find((p) => p.slug === slug);
}

export interface DemoStory {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
}

// Illustrative demo stories (chrome is translated; body is demo content).
export const DEMO_STORIES: DemoStory[] = [
  { slug: 'ancient-pilgrimage-routes', category: 'History', title: 'Ancient Pilgrimage Routes', excerpt: 'Follow the footsteps of millions of pilgrims who have journeyed to the Holy Land over two millennia.' },
  { slug: 'living-communities', category: 'Community', title: 'Living Communities', excerpt: 'Meet the faithful communities who maintain these sacred spaces and keep ancient traditions alive.' },
  { slug: 'guardians-of-sacred-art', category: 'Heritage', title: 'Guardians of Sacred Art', excerpt: 'The artisans and custodians preserving centuries-old mosaics, icons and manuscripts for future generations.' },
  { slug: 'stone-and-memory', category: 'Architecture', title: 'Stone and Memory', excerpt: 'How architecture across the Holy Land carries the layered history of many Christian traditions.' },
];
