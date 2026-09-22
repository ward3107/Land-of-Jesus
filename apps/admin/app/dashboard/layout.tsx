import { Sidebar } from '@/components/Sidebar';
import { getActiveLocale } from '@/lib/i18n';
import { createTranslator } from '@communitydirect/i18n';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getActiveLocale();
  const t = createTranslator(locale);
  return (
    <div className="flex min-h-screen">
      <Sidebar t={t} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
