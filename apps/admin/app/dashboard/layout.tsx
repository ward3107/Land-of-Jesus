import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { getActiveLocale } from '@/lib/i18n';
import { requireUser } from '@/lib/auth';
import { getCurrentOrganization } from '@/lib/org';
import { signOut } from '@/app/actions/auth';
import { createTranslator } from '@communitydirect/i18n';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const current = await getCurrentOrganization();
  if (!current) redirect('/onboarding');

  const locale = await getActiveLocale();
  const t = createTranslator(locale);

  return (
    <div className="flex min-h-screen">
      <Sidebar t={t} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">{current.organization.name}</p>
            <p className="text-xs text-ink-500">
              {current.role.replace('ORGANIZATION_', '').toLowerCase()} · @{current.organization.slug}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-500 sm:inline">{user.email}</span>
            <form action={signOut}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink-700 hover:bg-slate-100">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
