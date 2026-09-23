import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@communitydirect/core';
import { useLocale } from '@/lib/locale-context';
import { deleteMyAccount, exportMyData } from '@/lib/account';

export default function ProfileScreen() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      const data = await exportMyData();
      const size = JSON.stringify(data ?? {}).length;
      Alert.alert('Your data', `Exported ${size.toLocaleString()} bytes of your account data.`);
    } catch {
      Alert.alert('Export failed', 'Please try again later.');
    } finally {
      setBusy(false);
    }
  }

  function onDelete() {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, follows and device data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await deleteMyAccount();
              router.replace('/(onboarding)/welcome');
            } catch {
              Alert.alert('Delete failed', 'Please try again later.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t('common.profile')}
      </Text>

      <Text style={styles.section} accessibilityRole="header">
        {t('onboarding.chooseLanguage')}
      </Text>
      <View style={styles.langRow}>
        {SUPPORTED_LOCALES.map((l) => (
          <Pressable
            key={l}
            onPress={() => setLocale(l)}
            style={[styles.chip, l === locale && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: l === locale }}
            accessibilityLabel={`Set language to ${LOCALE_LABELS[l].english}`}
          >
            <Text style={[styles.chipText, l === locale && styles.chipTextSelected]}>
              {LOCALE_LABELS[l].native}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section} accessibilityRole="header">
        Your data & privacy
      </Text>
      <Pressable
        onPress={onExport}
        disabled={busy}
        style={[styles.action, busy && styles.actionDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Export my data"
        accessibilityHint="Downloads a copy of your account data"
      >
        <Text style={styles.actionText}>Export my data</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        disabled={busy}
        style={[styles.action, styles.actionDanger, busy && styles.actionDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Delete my account"
        accessibilityHint="Permanently deletes your account and data"
      >
        <Text style={[styles.actionText, styles.actionTextDanger]}>Delete my account</Text>
      </Pressable>

      <Text style={styles.hint}>No phone numbers, no behavioral profiling (see our privacy policy).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 28, gap: 10, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginTop: 12 },
  langRow: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 16, backgroundColor: 'white' },
  chipSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  chipText: { color: '#0f172a', fontWeight: '600' },
  chipTextSelected: { color: '#4338ca' },
  action: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, backgroundColor: 'white' },
  actionDanger: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: '#0f172a', fontWeight: '600' },
  actionTextDanger: { color: '#b91c1c' },
  hint: { color: '#94a3b8', fontSize: 13, marginTop: 16 },
});
