import { useLocale } from '@/lib/locale-context';
import { Screen } from '@/components/Screen';

export default function InboxScreen() {
  const { t } = useLocale();
  return <Screen title={t('common.inbox')} subtitle="Your message history across all organizations." />;
}
