import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { followViaJoin } from '@/lib/join';
import { useLocale } from '@/lib/locale-context';

type State = { phase: 'working' } | { phase: 'done' } | { phase: 'error'; message: string };

/**
 * Deep-link target for `communitydirect://join/<code>`. Follows the org the link
 * points to (explicit opt-in), attributes the signup source, then sends the user
 * to their Following list.
 */
export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const [state, setState] = useState<State>({ phase: 'working' });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!code) {
        if (active) setState({ phase: 'error', message: 'Missing invitation code.' });
        return;
      }
      const result = await followViaJoin(code);
      if (!active) return;
      setState(
        result.ok
          ? { phase: 'done' }
          : { phase: 'error', message: result.error ?? 'Could not follow.' },
      );
    })();
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <View style={styles.container}>
      {state.phase === 'working' ? (
        <>
          <ActivityIndicator color="#4f46e5" />
          <Text style={styles.msg}>Following…</Text>
        </>
      ) : null}

      {state.phase === 'done' ? (
        <>
          <Text style={styles.title}>You’re following! 🎉</Text>
          <Text style={styles.msg}>You’ll now receive this organization’s announcements.</Text>
          <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)/following')}>
            <Text style={styles.btnText}>{t('common.following')}</Text>
          </Pressable>
        </>
      ) : null}

      {state.phase === 'error' ? (
        <>
          <Text style={styles.title}>Couldn’t follow</Text>
          <Text style={styles.msg}>{state.message}</Text>
          <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)/discover')}>
            <Text style={styles.btnText}>{t('common.discover')}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  msg: { fontSize: 15, color: '#475569', textAlign: 'center' },
  btn: { marginTop: 12, backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: 'white', fontWeight: '600' },
});
