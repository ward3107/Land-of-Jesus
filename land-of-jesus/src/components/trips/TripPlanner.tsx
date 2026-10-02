'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { createTrip, directionsUrl, parseTrip, staysUrl, type TripPlan, type TripStop } from '@/lib/trips/plan';
import { TripMap } from './TripMap';

export interface TripPlace {
  slug: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface SavedTripRow {
  id: string;
  name: string;
  start_date: string | null;
  days: number;
  stops: unknown;
}

const STORAGE_KEY = 'land-of-jesus-trip-v1';

export function TripPlanner({ places, locale, configured }: { places: TripPlace[]; locale: string; configured: boolean }) {
  const t = useTranslations('Trip');
  const defaultName = t('defaultName');
  const common = useTranslations('Common');
  const knownSlugs = useMemo(() => new Set(places.map((place) => place.slug)), [places]);
  const bySlug = useMemo(() => new Map(places.map((place) => [place.slug, place])), [places]);
  const supabase = useMemo(() => configured ? createSupabaseBrowserClient() : null, [configured]);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [day, setDay] = useState(1);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [savedLocally, setSavedLocally] = useState(false);

  useEffect(() => {
    let restored: TripPlan | null = null;
    try { restored = parseTrip(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'), knownSlugs); } catch { /* Invalid old local data */ }
    const frame = requestAnimationFrame(() => setPlan(restored ?? { ...createTrip(), name: defaultName }));
    return () => cancelAnimationFrame(frame);
  }, [knownSlugs, defaultName]);

  useEffect(() => {
    if (!plan) return;
    let saved = false;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); saved = true; } catch { /* Storage may be disabled */ }
    const frame = requestAnimationFrame(() => setSavedLocally(saved));
    return () => cancelAnimationFrame(frame);
  }, [plan]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) setUser(data.user); }, () => { if (active) setUser(null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    void supabase.from('trip_plans').select('id,name,start_date,days,stops')
      .eq('user_id', user.id).order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setSavedTrips(error ? [] : (data ?? []) as SavedTripRow[]);
      }, () => { if (active) setSavedTrips([]); });
    return () => { active = false; };
  }, [supabase, user]);

  if (!plan) return <p role="status" className="py-8 text-muted">{t('loading')}</p>;

  const dayStops = plan.stops.map((stop, index) => ({ stop, index, place: bySlug.get(stop.slug) }))
    .filter((entry): entry is { stop: TripStop; index: number; place: TripPlace } => entry.stop.day === day && Boolean(entry.place));
  const dayPlaces = dayStops.map((entry) => entry.place);
  const matches = places.filter((place) => `${place.name} ${place.city}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))).slice(0, 20);

  function changePlan(next: TripPlan) {
    setPlan(next);
    setSaveState('idle');
  }

  function moveStop(index: number, direction: -1 | 1) {
    const position = dayStops.findIndex((entry) => entry.index === index);
    const other = dayStops[position + direction];
    if (!other) return;
    const stops = [...plan!.stops];
    [stops[index], stops[other.index]] = [stops[other.index], stops[index]];
    changePlan({ ...plan!, stops });
  }

  async function saveToAccount() {
    if (!supabase || !user || !plan || saving) return;
    const valid = parseTrip(plan, knownSlugs);
    if (!valid) { setSaveState('error'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('trip_plans').upsert({
        id: valid.id, user_id: user.id, name: valid.name,
        start_date: valid.startDate, days: valid.days, stops: valid.stops,
      });
      if (error) throw error;
      const { data } = await supabase.from('trip_plans').select('id,name,start_date,days,stops')
        .eq('user_id', user.id).order('updated_at', { ascending: false });
      setSavedTrips((data ?? []) as SavedTripRow[]);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  }

  function loadTrip(row: SavedTripRow) {
    const next = parseTrip({ id: row.id, name: row.name, startDate: row.start_date, days: row.days, stops: row.stops }, knownSlugs);
    if (!next) { setSaveState('error'); return; }
    setPlan(next);
    setDay(1);
    setSaveState('idle');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-night sm:col-span-1">{t('tripName')}
          <input type="text" maxLength={120} required value={plan.name} onChange={(event) => changePlan({ ...plan, name: event.target.value })}
            className="mt-2 h-11 w-full rounded-control border border-hairline bg-surface px-3 text-base" />
        </label>
        <label className="text-sm font-medium text-night">{t('startDate')}
          <input type="date" value={plan.startDate ?? ''} onChange={(event) => changePlan({ ...plan, startDate: event.target.value || null })}
            className="mt-2 h-11 w-full rounded-control border border-hairline bg-surface px-3 text-base" />
        </label>
        <label className="text-sm font-medium text-night">{t('days')}
          <select value={plan.days} onChange={(event) => {
            const days = Number(event.target.value);
            changePlan({ ...plan, days, stops: plan.stops.map((stop) => ({ ...stop, day: Math.min(stop.day, days) })) });
            setDay(Math.min(day, days));
          }} className="mt-2 h-11 w-full rounded-control border border-hairline bg-surface px-3 text-base">
            {Array.from({ length: 14 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
          </select>
        </label>
      </div>

      <div role="tablist" aria-label={t('days')} className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: plan.days }, (_, index) => (
          <button key={index} type="button" role="tab" aria-selected={day === index + 1} onClick={() => setDay(index + 1)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${day === index + 1 ? 'bg-primary-700 text-white' : 'bg-stone-100 text-night'}`}>
            {t('day', { number: index + 1 })}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="rounded-card border border-hairline bg-surface p-4">
            <h2 className="text-xl font-semibold text-night">{t('addSite')}</h2>
            <label htmlFor="trip-site-search" className="sr-only">{t('searchSites')}</label>
            <input id="trip-site-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchSites')} className="mt-3 h-11 w-full rounded-control border border-hairline px-3 text-base" />
            <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {matches.map((place) => <li key={place.slug}>
                <button type="button" disabled={plan.stops.length >= 50} onClick={() => changePlan({ ...plan, stops: [...plan.stops, { slug: place.slug, day, transport: 'walk' }] })}
                  className="flex w-full items-center justify-between gap-2 rounded-control px-3 py-2 text-start text-sm hover:bg-stone-100 disabled:opacity-40">
                  <span>{place.name} <span className="text-muted">· {place.city}</span></span><span aria-hidden="true">+</span>
                </button>
              </li>)}
            </ul>
          </section>

          <section aria-label={t('day', { number: day })} className="rounded-card border border-hairline bg-surface p-4">
            <h2 className="text-xl font-semibold text-night">{t('day', { number: day })}</h2>
            {dayStops.length === 0 ? <p className="mt-3 text-muted">{t('noStops')}</p> : (
              <ol className="mt-3 space-y-3">
                {dayStops.map(({ stop, index, place }, position) => {
                  const previous = dayStops[position - 1]?.place;
                  return <li key={`${place.slug}-${index}`} className="rounded-control border border-hairline p-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-700 text-sm font-bold text-white">{position + 1}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/churches/${place.slug}`} className="font-semibold text-primary-800 hover:underline">{place.name}</Link>
                        <p className="text-sm text-muted">{place.city}</p>
                      </div>
                    </div>
                    {previous && <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="text-sm text-muted">{t('transport')}
                        <select value={stop.transport} onChange={(event) => changePlan({ ...plan, stops: plan.stops.map((item, itemIndex) => itemIndex === index ? { ...item, transport: event.target.value as TripStop['transport'] } : item) })}
                          className="ms-2 rounded-control border border-hairline bg-surface px-2 py-1 text-night">
                          <option value="walk">{t('walk')}</option><option value="taxi">{t('taxi')}</option>
                        </select>
                      </label>
                      <a href={directionsUrl(previous, place, stop.transport)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-700 underline">{t('directions')}</a>
                    </div>}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <button type="button" disabled={position === 0} onClick={() => moveStop(index, -1)} className="text-primary-700 disabled:opacity-30">{t('earlier')}</button>
                      <button type="button" disabled={position === dayStops.length - 1} onClick={() => moveStop(index, 1)} className="text-primary-700 disabled:opacity-30">{t('later')}</button>
                      <button type="button" onClick={() => changePlan({ ...plan, stops: plan.stops.filter((_, itemIndex) => itemIndex !== index) })} className="text-red-700">{t('remove')}</button>
                      <a href={staysUrl(place)} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">{t('stays')}</a>
                    </div>
                  </li>;
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-2">
          <TripMap places={dayPlaces} label={t('mapLabel')} />
          <p className="text-sm leading-relaxed text-muted">{t('routeNote')}</p>
        </div>
      </div>

      <section className="rounded-card border border-hairline bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{savedLocally ? t('localSaved') : null}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setPlan({ ...createTrip(), name: t('defaultName') }); setDay(1); setSaveState('idle'); }}
              className="rounded-full border border-hairline px-4 py-2 text-sm font-medium text-night">{t('newTrip')}</button>
            {user ? <button type="button" disabled={saving || !plan.name.trim()} onClick={saveToAccount}
              className="rounded-full bg-primary-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{common('save')}</button>
              : <Link href="/account" className="rounded-full bg-primary-700 px-4 py-2 text-sm font-medium text-white">{t('signInToSync')}</Link>}
          </div>
        </div>
        {saveState === 'saved' && <p role="status" className="mt-3 text-sm text-green-700">{t('saved')}</p>}
        {saveState === 'error' && <p role="alert" className="mt-3 text-sm text-red-700">{t('saveError')}</p>}
        {savedTrips.length > 0 && <div className="mt-5">
          <h2 className="text-lg font-semibold text-night">{t('savedTrips')}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{savedTrips.map((row) => <li key={row.id}>
            <button type="button" onClick={() => loadTrip(row)} className="rounded-full border border-hairline px-4 py-2 text-sm text-primary-800 hover:bg-stone-100">{row.name}</button>
          </li>)}</ul>
        </div>}
      </section>
    </div>
  );
}
