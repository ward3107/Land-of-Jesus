import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/card';
import { ProgressBar } from './ProgressBar';

export interface ProjectCardProps {
  slug: string;
  title: string;
  church?: string | null;
  progress: number;
  goal: string;
  progressLabel: string;
  goalLabel: string;
  learnMoreLabel: string;
}

/**
 * Preservation-project card: title, optional church, an accessible progress bar,
 * and the fundraising goal. Links to the project profile (locale-aware).
 */
export function ProjectCard({
  slug,
  title,
  church,
  progress,
  goal,
  progressLabel,
  goalLabel,
  learnMoreLabel,
}: ProjectCardProps) {
  return (
    <Card className="p-6 transition-shadow hover:shadow-lg">
      <Link
        href={`/projects/${slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <h3 className="mb-2 text-xl font-semibold text-stone-900">{title}</h3>
        {church ? <p className="mb-4 text-stone-600">{church}</p> : null}
        <ProgressBar
          className="mb-4"
          value={progress}
          label={progressLabel}
          valueLabel={`${progress}%`}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">
            {goalLabel}: {goal}
          </span>
          <span className="flex items-center text-sm font-medium text-primary-700">
            {learnMoreLabel}
            <ArrowRight className="ms-1 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
