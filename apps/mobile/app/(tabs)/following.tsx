import { makeTranslator } from '@/lib/i18n';
import { Screen } from '@/components/Screen';

export default function FollowingScreen() {
  const t = makeTranslator('en');
  return <Screen title={t('common.following')} subtitle="Organizations you have chosen to follow." />;
}
