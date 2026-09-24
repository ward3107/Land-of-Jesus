'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MapPin, Search, Filter, List, Map as MapIcon } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { ChurchCard } from '@/components/churches/ChurchCard';
import { Card } from '@/components/ui/card';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { cn } from '@/lib/utils';
import { DEMO_CHURCHES as SOURCE } from '@/lib/demo/data';

// Card-shaped view of the shared demo source (replaced by Supabase later).
const DEMO_CHURCHES = SOURCE.map((c) => ({
  slug: c.slug,
  name: c.name,
  location: c.location.city,
  tradition: c.tradition,
  isOpen: c.visitingInfo.isOpen === true,
  hasProjects: c.hasProjects,
  image: c.image,
}));

export function ExploreView({ initialView }: { initialView: 'list' | 'map' }) {
  const t = useTranslations('Explore');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(
    initialView,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = DEMO_CHURCHES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectClass =
    'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="min-h-screen bg-white">
      {/* Search + controls */}
      <div className="sticky top-16 z-20 border-b border-stone-200 bg-white">
        <Container size="full" className="max-w-[1920px]">
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <label htmlFor="church-search" className="sr-only">
              {t('searchPlaceholder')}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-stone-400" aria-hidden="true" />
              <input
                id="church-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pe-4 ps-11 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              {t('filters')}
            </button>

            <div className="flex rounded-lg bg-stone-100 p-1" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 transition-colors',
                  viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                )}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('listView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 transition-colors',
                  viewMode === 'map' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900',
                )}
              >
                <MapIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('mapView')}</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <label htmlFor="f-location" className="mb-2 block text-sm font-medium text-stone-700">
                    {t('location')}
                  </label>
                  <select id="f-location" className={selectClass}>
                    <option value="">{t('allLocations')}</option>
                    <option value="nazareth">Nazareth</option>
                    <option value="bethlehem">Bethlehem</option>
                    <option value="jerusalem">Jerusalem</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-tradition" className="mb-2 block text-sm font-medium text-stone-700">
                    {t('tradition')}
                  </label>
                  <select id="f-tradition" className={selectClass}>
                    <option value="">{t('allTraditions')}</option>
                    <option value="catholic">{t('traditionCatholic')}</option>
                    <option value="orthodox">{t('traditionOrthodox')}</option>
                    <option value="armenian">{t('traditionArmenian')}</option>
                    <option value="anglican">{t('traditionAnglican')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-type" className="mb-2 block text-sm font-medium text-stone-700">
                    {t('type')}
                  </label>
                  <select id="f-type" className={selectClass}>
                    <option value="">{t('allTypes')}</option>
                    <option value="church">{t('typeChurch')}</option>
                    <option value="chapel">{t('typeChapel')}</option>
                    <option value="monastery">{t('typeMonastery')}</option>
                    <option value="archaeological">{t('typeArchaeological')}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-stone-700">{t('openToVisitors')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </Container>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1920px]">
        {viewMode === 'list' ? (
          <div className="p-6">
            {filtered.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <div key={c.slug} className="relative">
                    <ChurchCard slug={c.slug} name={c.name} location={c.location} tradition={c.tradition} imageUrl={c.image} />
                    {(c.isOpen || c.hasProjects) && (
                      <div className="pointer-events-none absolute inset-x-6 bottom-6 flex flex-wrap gap-2">
                        {c.isOpen && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700">
                            {t('openToVisitorsBadge')}
                          </span>
                        )}
                        {c.hasProjects && (
                          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs text-primary-700">
                            {t('hasProjects')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <MapPin className="mx-auto mb-4 h-16 w-16 text-stone-300" aria-hidden="true" />
                <h3 className="mb-2 text-xl font-semibold text-stone-900">{t('noResultsTitle')}</h3>
                <p className="text-stone-600">{t('noResultsSubtitle')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid h-[calc(100vh-320px)] lg:grid-cols-5">
            <div className="overflow-y-auto border-e border-stone-200 p-6 lg:col-span-2">
              <div className="space-y-4">
                {filtered.map((c) => (
                  <Card key={c.slug} className="transition-shadow hover:shadow-md">
                    <Link
                      href={`/churches/${c.slug}`}
                      className="flex gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <ImagePlaceholder src={c.image} alt={c.name} ratio="square" className="h-24 w-24 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 truncate font-semibold text-stone-900">{c.name}</h3>
                        <p className="mb-2 text-sm text-stone-600">{c.location}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-700">{c.tradition}</span>
                          {c.isOpen && (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">{t('open')}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>

            <div className="relative hidden bg-stone-100 lg:col-span-3 lg:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapIcon className="mx-auto mb-4 h-24 w-24 text-stone-300" aria-hidden="true" />
                  <p className="text-lg text-stone-500">{t('mapComingSoon')}</p>
                </div>
              </div>
              {filtered.map((c, idx) => (
                <div
                  key={c.slug}
                  className="absolute -translate-x-1/2 -translate-y-full cursor-pointer"
                  style={{ insetInlineStart: `${20 + idx * 30}%`, top: `${30 + idx * 20}%` }}
                >
                  <Link
                    href={`/churches/${c.slug}`}
                    className="rounded-full bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary-700"
                  >
                    {c.name.split(' ').pop()}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
