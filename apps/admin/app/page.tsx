import Link from 'next/link';
import { getActiveLocale } from '@/lib/i18n';
import { createTranslator } from '@communitydirect/i18n';

export default async function LandingPage() {
  const locale = await getActiveLocale();
  const t = createTranslator(locale);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
          {t('common.appName')}
        </p>
        <h1 className="text-4xl font-bold text-ink-900">Own your audience.</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-700">
          A reliable, opt-in channel from your organization straight to your community — without
          depending on a third-party messaging platform.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700"
        >
          {t('admin.overview')} →
        </Link>
        <Link
          href="/join/demo"
          className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-ink-700 hover:bg-slate-100"
        >
          {t('onboarding.discoverOrganizations')}
        </Link>
      </div>
    </main>
  );
}
