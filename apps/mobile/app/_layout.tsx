import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider } from '@/lib/locale-context';
import { parseDeepLink } from '@/lib/deep-links';

/**
 * Route a notification tap (warm or cold start) to its deep-link target. The
 * push payload carries `data.url = communitydirect://messages/<id>`; tapping it
 * opens the exact message (spec §22).
 */
function useNotificationRouting() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const data = lastResponse?.notification.request.content.data as { url?: unknown } | undefined;
    if (typeof data?.url !== 'string') return;
    const parsed = parseDeepLink(data.url);
    if (parsed.type === 'message' && parsed.id) router.push(`/messages/${parsed.id}`);
    else if (parsed.type === 'join' && parsed.id) router.push(`/join/${parsed.id}`);
  }, [lastResponse, router]);
}

export default function RootLayout() {
  useNotificationRouting();
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="messages/[id]" options={{ title: 'Message' }} />
          <Stack.Screen name="join/[code]" options={{ title: 'Join' }} />
        </Stack>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
