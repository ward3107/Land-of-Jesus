import { z } from 'zod';

export const tripStopSchema = z.object({
  slug: z.string().min(1).max(150),
  day: z.number().int().min(1).max(14),
  transport: z.enum(['walk', 'taxi']),
});

export const tripPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  startDate: z.iso.date().nullable(),
  days: z.number().int().min(1).max(14),
  stops: z.array(tripStopSchema).max(50),
});

export type TripPlan = z.infer<typeof tripPlanSchema>;
export type TripStop = z.infer<typeof tripStopSchema>;

export function createTrip(): TripPlan {
  return { id: crypto.randomUUID(), name: 'My pilgrimage', startDate: null, days: 1, stops: [] };
}

export function parseTrip(value: unknown, knownSlugs: ReadonlySet<string>): TripPlan | null {
  const result = tripPlanSchema.safeParse(value);
  if (!result.success || result.data.stops.some((stop) => !knownSlugs.has(stop.slug) || stop.day > result.data.days)) return null;
  return result.data;
}

export function directionsUrl(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  transport: TripStop['transport'],
): string {
  const origin = `${from.latitude},${from.longitude}`;
  const destination = `${to.latitude},${to.longitude}`;
  const mode = transport === 'walk' ? 'walking' : 'driving';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
}

export function staysUrl(place: { latitude: number; longitude: number }): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotels near ${place.latitude},${place.longitude}`)}`;
}
