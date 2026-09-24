import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/card';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export interface ChurchCardProps {
  slug: string;
  name: string;
  location: string;
  tradition?: string;
  imageUrl?: string | null;
}

/**
 * Featured/listed church card: 16:10 image area + name, location and an optional
 * tradition pill. Links to the church profile (locale-aware).
 */
export function ChurchCard({ slug, name, location, tradition, imageUrl }: ChurchCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link
        href={`/churches/${slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <ImagePlaceholder src={imageUrl} alt={name} ratio="16/10" />
        <div className="p-6">
          <h3 className="mb-2 text-xl font-semibold text-stone-900">{name}</h3>
          <p className="mb-3 text-stone-600">{location}</p>
          {tradition ? (
            <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
              {tradition}
            </span>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}
