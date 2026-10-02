'use client';

import { useEffect, useRef } from 'react';
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TripPlace } from './TripPlanner';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const RTL_TEXT_PLUGIN = { pluginUrl: '/vendor/mapbox-gl-rtl-text-0.2.3.min.js', lazy: true };

export function TripMap({ places, label }: { places: TripPlace[]; label: string }) {
  const mapRef = useRef<MapRef>(null);
  const coordinates = places.map((place) => [place.longitude, place.latitude]);

  useEffect(() => {
    if (!mapRef.current || places.length === 0) return;
    if (places.length === 1) {
      mapRef.current.flyTo({ center: [places[0].longitude, places[0].latitude], zoom: 12, duration: 0 });
      return;
    }
    const west = Math.min(...places.map((place) => place.longitude));
    const east = Math.max(...places.map((place) => place.longitude));
    const south = Math.min(...places.map((place) => place.latitude));
    const north = Math.max(...places.map((place) => place.latitude));
    mapRef.current.fitBounds([[west, south], [east, north]], { padding: 65, maxZoom: 12, duration: 0 });
  }, [places]);

  return (
    <div role="region" aria-label={label} className="relative h-[360px] overflow-hidden rounded-card border border-hairline bg-stone-100 md:h-[480px]">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 31.9, longitude: 35.2, zoom: 7 }}
        onLoad={() => {
          if (places.length > 1) {
            const west = Math.min(...places.map((place) => place.longitude));
            const east = Math.max(...places.map((place) => place.longitude));
            const south = Math.min(...places.map((place) => place.latitude));
            const north = Math.max(...places.map((place) => place.latitude));
            mapRef.current?.fitBounds([[west, south], [east, north]], { padding: 65, maxZoom: 12, duration: 0 });
          } else if (places.length === 1) {
            mapRef.current?.flyTo({ center: [places[0].longitude, places[0].latitude], zoom: 12, duration: 0 });
          }
        }}
        mapStyle={STYLE}
        RTLTextPlugin={RTL_TEXT_PLUGIN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        {coordinates.length > 1 && (
          <Source id="trip-order" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }}>
            <Layer id="trip-order-line" type="line" paint={{ 'line-color': '#9a5a2b', 'line-width': 4, 'line-dasharray': [2, 2] }} />
          </Source>
        )}
        {places.map((place, index) => (
          <Marker key={`${place.slug}-${index}`} longitude={place.longitude} latitude={place.latitude} anchor="bottom">
            <span title={place.name} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-primary-700 text-sm font-bold text-white shadow-lg">
              {index + 1}
            </span>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
