'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import { Link } from '@/lib/i18n/navigation';
import type { ExploreChurch } from '@/app/[locale]/explore/ExploreView';

// OpenFreeMap: free, open-source vector tiles — no API key, no account, no limits.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// MapLibre GL v4 UMD packages its Web Worker as an inline Blob, so it needs no
// separate worker file — this sidesteps Turbopack's inability to bundle the
// worker (which leaves the map blank). Loaded from CDN at runtime.
const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
let maplibrePromise: Promise<any> | null = null;

// Load the MapLibre GL UMD bundle once (shared across mounts).
function loadMaplibre(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.maplibregl) return Promise.resolve(w.maplibregl);
  if (maplibrePromise) return maplibrePromise;
  maplibrePromise = new Promise((resolve) => {
    if (!document.getElementById('maplibre-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-css';
      link.rel = 'stylesheet';
      link.href = MAPLIBRE_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = MAPLIBRE_JS;
    script.async = true;
    script.onload = () => resolve(w.maplibregl);
    document.body.appendChild(script);
  });
  return maplibrePromise;
}

function useMaplibre(): any {
  const [lib, setLib] = useState<any>(null);
  useEffect(() => {
    let cancelled = false;
    loadMaplibre().then((m) => {
      if (!cancelled) setLib(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return lib;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Interactive church map (MapLibre GL + OpenFreeMap). A marker per church, with
 * a popup linking to the profile. Coordinates come from the data layer. Free —
 * no token, no account, no sign-up.
 */
export function ChurchMap({ churches }: { churches: ExploreChurch[] }) {
  const maplibregl = useMaplibre();
  const [active, setActive] = useState<ExploreChurch | null>(null);
  const points = churches.filter((c) => c.latitude && c.longitude);

  if (!maplibregl) return null;

  return (
    <Map
      mapLib={maplibregl}
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
