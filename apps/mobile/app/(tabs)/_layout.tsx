import { Tabs } from 'expo-router';
import { useLocale } from '@/lib/locale-context';

export default function TabsLayout() {
  const { t } = useLocale();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#4f46e5' }}>
      <Tabs.Screen name="index" options={{ title: t('common.home') }} />
      <Tabs.Screen name="following" options={{ title: t('common.following') }} />
      <Tabs.Screen name="discover" options={{ title: t('common.discover') }} />
      <Tabs.Screen name="inbox" options={{ title: t('common.inbox') }} />
      <Tabs.Screen name="profile" options={{ title: t('common.profile') }} />
    </Tabs>
  );
}
