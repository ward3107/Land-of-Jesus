'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import Map, { Marker, Popup, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from '@/lib/i18n/navigation';
import type { ExploreChurch } from '@/app/[locale]/explore/ExploreView';

// OpenFreeMap: free, open-source vector tiles — no API key, no account, no limits.
// The map engine is the pinned, bundled `maplibre-gl` v4 npm package (its worker
// is an inline Blob, so it bundles under Turbopack) — no third-party CDN script.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// MapLibre can't lay out right-to-left scripts by itself: without this plugin
// Hebrew labels render reversed and Arabic letters unjoined. Self-hosted copy of
// @mapbox/mapbox-gl-rtl-text 0.2.3 (BSD-2-Clause, license alongside it), the
// version MapLibre v4 documents; loaded lazily, only when RTL text is on screen.
export const RTL_TEXT_PLUGIN_URL = '/vendor/mapbox-gl-rtl-text-0.2.3.min.js';
const RTL_TEXT_PLUGIN = { pluginUrl: RTL_TEXT_PLUGIN_URL, lazy: true };

function framePlaces(map: MapRef | null, points: ExploreChurch[]) {
  if (!map || points.length === 0) return;
  if (points.length === 1) {
    map.flyTo({ center: [points[0].longitude, points[0].latitude], zoom: 12, duration: 0 });
    return;
  }
  const west = Math.min(...points.map((point) => point.longitude));
  const east = Math.max(...points.map((point) => point.longitude));
  const south = Math.min(...points.map((point) => point.latitude));
  const north = Math.max(...points.map((point) => point.latitude));
  map.fitBounds([[west, south], [east, north]], { padding: 60, maxZoom: 12, duration: 0 });
}

/**
 * Interactive church map (MapLibre GL + OpenFreeMap). A marker per church, with
 * a popup linking to the profile. Coordinates come from the data layer. Free —
 * no token, no account, no sign-up.
 */
export function ChurchMap({ churches }: { churches: ExploreChurch[] }) {
  const t = useTranslations('Explore');
  const mapRef = useRef<MapRef>(null);
  const [active, setActive] = useState<ExploreChurch | null>(null);
  const points = useMemo(() => churches.filter((c) => c.latitude && c.longitude), [churches]);

  useEffect(() => { framePlaces(mapRef.current, points); }, [points]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: 31.9, longitude: 35.2, zoom: 7 }}
      onLoad={() => framePlaces(mapRef.current, points)}
      mapStyle={MAP_STYLE}
      RTLTextPlugin={RTL_TEXT_PLUGIN}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      {points.map((c, index) => (
        <Marker
          key={c.slug}
          latitude={c.latitude}
          longitude={c.longitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setActive(c);
          }}
        >
          <button
            type="button"
            aria-label={c.name}
            className="rounded-full bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary-700"
          >
            {index + 1}
          </button>
        </Marker>
      ))}

      {active && points.some((point) => point.slug === active.slug) && (
        <Popup
          latitude={active.latitude}
          longitude={active.longitude}
          anchor="top"
          onClose={() => setActive(null)}
          closeOnClick={false}
          maxWidth="240px"
        >
          <div className="p-1">
            <p className="font-semibold text-stone-900">{active.name}</p>
            <p className="mb-2 text-sm text-stone-600">{active.location}</p>
            <Link href={`/churches/${active.slug}`} className="text-sm font-medium text-primary-700 hover:underline">
              {t('viewChurch')}
              <ArrowRight className="ms-1 inline h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
