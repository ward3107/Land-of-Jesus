import { makeTranslator } from '@/lib/i18n';
import { Screen } from '@/components/Screen';

export default function InboxScreen() {
  const t = makeTranslator('en');
  return <Screen title={t('common.inbox')} subtitle="Your message history across all organizations." />;
}
