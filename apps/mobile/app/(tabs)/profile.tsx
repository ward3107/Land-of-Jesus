import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@communitydirect/core';
import { useLocale } from '@/lib/locale-context';

export default function ProfileScreen() {
  const { locale, setLocale, t } = useLocale();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.profile')}</Text>

      <Text style={styles.section}>{t('onboarding.chooseLanguage')}</Text>
      <View style={styles.langRow}>
        {SUPPORTED_LOCALES.map((l) => (
          <Pressable
            key={l}
            onPress={() => setLocale(l)}
            style={[styles.chip, l === locale && styles.chipSelected]}
          >
            <Text style={[styles.chipText, l === locale && styles.chipTextSelected]}>
              {LOCALE_LABELS[l].native}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Notifications</Text>
      <Link href="/(onboarding)/notifications" style={styles.link}>
        {t('onboarding.allowNotifications')}
      </Link>

      <Text style={styles.hint}>Privacy, account and quiet hours settings arrive next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 28, gap: 10, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginTop: 12 },
  langRow: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'white' },
  chipSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  chipText: { color: '#0f172a', fontWeight: '600' },
  chipTextSelected: { color: '#4338ca' },
  link: { color: '#4f46e5', fontWeight: '600', paddingVertical: 6 },
  hint: { color: '#94a3b8', fontSize: 13, marginTop: 16 },
});
