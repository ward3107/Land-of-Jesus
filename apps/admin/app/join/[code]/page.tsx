import Link from 'next/link';
import { getActiveLocale } from '@/lib/i18n';
import { createTranslator } from '@communitydirect/i18n';

const APP_SCHEME = process.env.APP_DEEP_LINK_SCHEME ?? 'communitydirect';

/**
 * Public join / WhatsApp-migration landing page (spec §29). If the app is
 * installed the deep link opens the organization directly; otherwise the store
 * buttons take over. Following is always explicit — this page never subscribes
 * anyone automatically.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const locale = await getActiveLocale();
  const t = createTranslator(locale);
  const deepLink = `${APP_SCHEME}://join/${code}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-600">
        CD
      </div>
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t('onboarding.welcomeTitle')}</h1>
        <p className="mt-2 text-ink-700">{t('onboarding.welcomeSubtitle')}</p>
        <p className="mt-4 text-sm text-ink-500">
          Invitation code: <span className="font-mono font-semibold">{code}</span>
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <a
          href={deepLink}
          className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700"
        >
          {t('common.follow')}
        </a>
        <div className="flex gap-3">
          <span className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm text-ink-500">
            App Store
          </span>
          <span className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm text-ink-500">
            Google Play
          </span>
        </div>
        <Link href="/" className="mt-2 text-sm text-brand-600 hover:underline">
          ← {t('common.appName')}
        </Link>
      </div>
    </main>
  );
}
