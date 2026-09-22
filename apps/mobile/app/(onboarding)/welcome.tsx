import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/lib/locale-context';

export default function WelcomeScreen() {
  const { t } = useLocale();
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>CD</Text>
      </View>
      <Text style={styles.title}>{t('onboarding.welcomeTitle')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.welcomeSubtitle')}</Text>
      <Link href="/(onboarding)/language" style={styles.button}>
        {t('onboarding.chooseLanguage')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28, backgroundColor: '#f8fafc' },
  badge: { height: 72, width: 72, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#4f46e5', fontWeight: '800', fontSize: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#475569', textAlign: 'center' },
  button: { marginTop: 12, backgroundColor: '#4f46e5', color: 'white', fontWeight: '600', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, overflow: 'hidden' },
});
