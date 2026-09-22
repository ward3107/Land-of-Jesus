import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/lib/locale-context';
import { ensureSession } from '@/lib/session';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    try {
      // Device-first: make sure we have a session, then register for push.
      await ensureSession();
      await registerForPushNotificationsAsync();
    } catch {
      // Permission denied or unavailable — proceed regardless; the user can
      // enable notifications later in Profile.
    } finally {
      setBusy(false);
      router.replace('/(tabs)/discover');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.allowNotifications')}</Text>
      <Text style={styles.subtitle}>
        Get a notification when an organization you follow sends a message. You can change this
        anytime.
      </Text>
      <Pressable style={styles.button} onPress={enable} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{t('onboarding.allowNotifications')}</Text>
        )}
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)/discover')} disabled={busy}>
        <Text style={styles.skip}>Not now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 16, padding: 28, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 15, color: '#475569' },
  button: { marginTop: 8, backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  skip: { textAlign: 'center', color: '#64748b', paddingVertical: 8 },
});
