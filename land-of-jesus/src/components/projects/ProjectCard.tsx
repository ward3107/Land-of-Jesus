import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
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
 * Preservation-project card: title, optional church, an accessible progress
 * bar and the fundraising goal. The whole card links to the project profile.
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
    <Link
      href={`/projects/${slug}`}
      className="block rounded-card border border-hairline/80 bg-surface p-5 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
    >
      <h3 className="text-[17px] font-semibold leading-snug text-night">{title}</h3>
      {church ? <p className="mt-0.5 text-[15px] text-muted">{church}</p> : null}
      <ProgressBar className="mt-4" value={progress} label={progressLabel} valueLabel={`${progress}%`} />
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {goalLabel}: {goal}
        </span>
        <span className="flex items-center text-sm font-semibold text-primary-700">
          {learnMoreLabel}
          <ArrowRight className="ms-1 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
