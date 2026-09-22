import { makeTranslator } from '@/lib/i18n';
import { Screen } from '@/components/Screen';

export default function DiscoverScreen() {
  const t = makeTranslator('en');
  return (
    <Screen
      title={t('common.discover')}
      subtitle="Search organizations, or scan a QR code to follow one."
    />
  );
}
