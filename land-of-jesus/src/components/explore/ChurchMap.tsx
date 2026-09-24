'use client';

import { useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from '@/lib/i18n/navigation';
import type { ExploreChurch } from '@/app/[locale]/explore/ExploreView';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * Interactive church map. Renders a Mapbox map with a marker per church when a
 * public token is configured; otherwise falls back to a labelled placeholder so
 * the page never breaks. Coordinates come from the data layer.
 */
export function ChurchMap({ churches, placeholder }: { churches: ExploreChurch[]; placeholder: string }) {
  const [active, setActive] = useState<ExploreChurch | null>(null);
  const points = churches.filter((c) => c.latitude && c.longitude);

  if (!TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto mb-4 h-24 w-24 text-stone-300" aria-hidden="true" />
          <p className="text-lg text-stone-500">{placeholder}</p>
        </div>
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={TOKEN}
      initialViewState={{ latitude: 31.9, longitude: 35.2, zoom: 7 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
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
