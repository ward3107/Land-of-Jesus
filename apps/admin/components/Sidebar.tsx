import Link from 'next/link';
import type { createTranslator } from '@communitydirect/i18n';

type Translator = ReturnType<typeof createTranslator>;

const NAV: { href: string; key: Parameters<Translator>[0] }[] = [
  { href: '/dashboard', key: 'admin.overview' },
  { href: '/dashboard/messages', key: 'admin.messages' },
  { href: '/dashboard/messages/new', key: 'admin.createMessage' },
  { href: '/dashboard/scheduled', key: 'admin.scheduled' },
  { href: '/dashboard/subscribers', key: 'admin.subscribers' },
  { href: '/dashboard/segments', key: 'admin.segments' },
  { href: '/dashboard/channels', key: 'admin.channels' },
  { href: '/dashboard/media', key: 'admin.media' },
  { href: '/dashboard/analytics', key: 'admin.analytics' },
  { href: '/dashboard/team', key: 'admin.team' },
  { href: '/dashboard/settings', key: 'admin.settings' },
];

export function Sidebar({ t }: { t: Translator }) {
  return (
    <nav
      aria-label="Primary"
      className="flex w-60 shrink-0 flex-col gap-1 border-e border-slate-200 bg-white p-4"
    >
      <p className="mb-4 px-2 text-lg font-bold text-brand-600">{t('common.appName')}</p>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-100"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
