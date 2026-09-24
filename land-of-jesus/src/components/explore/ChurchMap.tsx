'use client';

import { useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from '@/lib/i18n/navigation';
import type { ExploreChurch } from '@/app/[locale]/explore/ExploreView';

// OpenFreeMap: free, open-source vector tiles — no API key, no account, no limits.
// The map engine is the pinned, bundled `maplibre-gl` v4 npm package (its worker
// is an inline Blob, so it bundles under Turbopack) — no third-party CDN script.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Interactive church map (MapLibre GL + OpenFreeMap). A marker per church, with
 * a popup linking to the profile. Coordinates come from the data layer. Free —
 * no token, no account, no sign-up.
 */
export function ChurchMap({ churches }: { churches: ExploreChurch[] }) {
  const [active, setActive] = useState<ExploreChurch | null>(null);
  const points = churches.filter((c) => c.latitude && c.longitude);

  return (
    <Map
      initialViewState={{ latitude: 31.9, longitude: 35.2, zoom: 7 }}
      mapStyle={MAP_STYLE}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      {points.map((c) => (
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
            {c.name.split(' ').pop()}
          </button>
        </Marker>
      ))}

      {active && (
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
              View church →
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
