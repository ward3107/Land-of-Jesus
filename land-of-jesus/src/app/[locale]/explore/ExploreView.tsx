'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MapPin, Search, Filter, List, Map as MapIcon } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { ChurchCard } from '@/components/churches/ChurchCard';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChurchMap } from '@/components/explore/ChurchMap';

export interface ExploreChurch {
  slug: string;
  name: string;
  location: string;
  tradition: string;
  isOpen: boolean;
  hasProjects: boolean;
  image: string;
  latitude: number;
  longitude: number;
}

export function ExploreView({
  initialView,
  churches,
}: {
  initialView: 'list' | 'map';
  churches: ExploreChurch[];
}) {
  const t = useTranslations('Explore');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = churches.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectClass =
    'w-full rounded-control border border-hairline bg-surface px-3 py-2.5 text-base text-night focus:outline-none focus:ring-2 focus:ring-primary-500';
  const segment = (active: boolean) =>
    cn(
      'flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      active ? 'bg-surface text-night shadow-sm' : 'text-muted hover:text-night',
    );

  return (
    <div className="min-h-[100svh]">
      {/* Search + controls */}
      <div className="frosted stick-below-topbar sticky z-30 border-b border-hairline">
        <Container size="full" className="max-w-[1920px]">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <label htmlFor="church-search" className="sr-only">
              {t('searchPlaceholder')}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-muted" aria-hidden="true" />
              <input
                id="church-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-11 w-full rounded-control bg-stone-100 pe-4 ps-10 text-base text-night placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                aria-controls="explore-filters"
                className={cn(buttonVariants({ variant: showFilters ? 'tinted' : 'secondary', size: 'sm' }), 'h-11')}
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                {t('filters')}
              </button>

              <div className="flex h-11 rounded-full bg-stone-100 p-1" role="group" aria-label={t('viewMode')}>
                <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={segment(viewMode === 'list')}>
                  <List className="h-4 w-4" aria-hidden="true" />
                  <span>{t('listView')}</span>
                </button>
                <button type="button" onClick={() => setViewMode('map')} aria-pressed={viewMode === 'map'} className={segment(viewMode === 'map')}>
                  <MapIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{t('mapView')}</span>
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div id="explore-filters" className="mb-3 rounded-card border border-hairline bg-surface p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label htmlFor="f-location" className="mb-2 block text-sm font-medium text-night">
                    {t('location')}
                  </label>
                  <select id="f-location" className={selectClass}>
                    <option value="">{t('allLocations')}</option>
                    <option value="nazareth">{t('cityNazareth')}</option>
                    <option value="bethlehem">{t('cityBethlehem')}</option>
                    <option value="jerusalem">{t('cityJerusalem')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-tradition" className="mb-2 block text-sm font-medium text-night">
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
                  <label htmlFor="f-type" className="mb-2 block text-sm font-medium text-night">
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
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input type="checkbox" className="h-5 w-5 rounded accent-primary-600" />
                    <span className="text-sm text-night">{t('openToVisitors')}</span>
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
          <div className="p-4 sm:p-6">
            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <ChurchCard key={c.slug} slug={c.slug} name={c.name} location={c.location} tradition={c.tradition} imageUrl={c.image}>
                    {c.isOpen ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        {t('openToVisitorsBadge')}
                      </span>
                    ) : null}
                    {c.hasProjects ? (
                      <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                        {t('hasProjects')}
                      </span>
                    ) : null}
                  </ChurchCard>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <MapPin className="mx-auto mb-4 h-14 w-14 text-stone-300" aria-hidden="true" />
                <h3 className="mb-2 text-xl font-semibold text-night">{t('noResultsTitle')}</h3>
                <p className="text-muted">{t('noResultsSubtitle')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:h-[calc(100svh-12rem)] lg:grid-cols-5">
            <div className="relative h-[55svh] bg-stone-100 lg:order-last lg:col-span-3 lg:h-auto">
              <ChurchMap churches={filtered} />
            </div>
            <div className="p-4 sm:p-6 lg:col-span-2 lg:overflow-y-auto lg:border-e lg:border-hairline">
              <ul className="space-y-3">
                {filtered.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/churches/${c.slug}`}
                      className="flex gap-4 rounded-card border border-hairline/80 bg-surface p-3 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <ImagePlaceholder src={c.image} alt="" ratio="square" sizes="80px" className="h-20 w-20 shrink-0 rounded-control" />
                      <div className="min-w-0 flex-1 py-0.5">
                        <h3 className="truncate font-semibold text-night">{c.name}</h3>
                        <p className="mt-0.5 text-sm text-muted">{c.location}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">{c.tradition}</span>
                          {c.isOpen && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{t('open')}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
