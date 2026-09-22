import { makeTranslator } from '@/lib/i18n';
import { Screen } from '@/components/Screen';

export default function HomeScreen() {
  const t = makeTranslator('en');
  return (
    <Screen
      title={t('onboarding.welcomeTitle')}
      subtitle="The latest messages from the organizations you follow will appear here."
    />
  );
}
