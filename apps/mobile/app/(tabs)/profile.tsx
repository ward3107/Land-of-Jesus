import { makeTranslator } from '@/lib/i18n';
import { Screen } from '@/components/Screen';

export default function ProfileScreen() {
  const t = makeTranslator('en');
  return (
    <Screen
      title={t('common.profile')}
      subtitle="Language, notification settings, privacy and account."
    />
  );
}
